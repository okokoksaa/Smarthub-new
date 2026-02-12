import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface KnowledgeChunkRow {
  id: string;
  source_id: string;
  section_label: string | null;
  chunk_text: string;
  chunk_order: number;
  source: {
    id: string;
    title: string;
    source_type: 'act' | 'guideline' | 'circular';
    version_label: string | null;
    document_url: string | null;
    effective_date: string | null;
  };
}

export interface KnowledgeSourceCitation {
  sourceId: string;
  title: string;
  sourceType: 'act' | 'guideline' | 'circular';
  section: string;
  excerpt: string;
  url: string | null;
  score: number;
}

export interface KnowledgeChatResponse {
  answer: string;
  sources: KnowledgeSourceCitation[];
  mode: 'llm' | 'extractive';
}

@Injectable()
export class AiKnowledgeService {
  private readonly logger = new Logger(AiKnowledgeService.name);
  private readonly supabase: SupabaseClient;
  private readonly allowedSourceTypes: Array<'act' | 'guideline' | 'circular'> = [
    'act',
    'guideline',
    'circular',
  ];

  constructor(private readonly configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get<string>('SUPABASE_URL'),
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY'),
    );
  }

  async askKnowledge(query: string): Promise<KnowledgeChatResponse> {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      throw new BadRequestException('Query is required');
    }

    // Deterministic short answer for core definition query to avoid OCR noise.
    if (this.isCdfDefinitionQuery(normalizedQuery)) {
      const definitionChunks = await this.retrieveRelevantChunks(
        'constituency development fund established under constitution and act',
      );
      const definitionSources = this.buildCitations(normalizedQuery, definitionChunks).slice(0, 2);

      return {
        answer:
          'CDF means the Constituency Development Fund — public funds allocated to each constituency to finance community-priority local development projects, bursaries, and empowerment programs under the CDF Act and Guidelines.',
        sources: definitionSources,
        mode: 'extractive',
      };
    }

    const chunks = await this.retrieveRelevantChunks(normalizedQuery);

    if (chunks.length === 0) {
      return {
        answer:
          'I could not find a matching clause in the current CDF Act, Guidelines, or Circulars. Try a more specific question or include key terms from the policy text.',
        sources: [],
        mode: 'extractive',
      };
    }

    const sources = this.buildCitations(normalizedQuery, chunks);
    const llmAnswer = await this.tryGenerateWithLlm(normalizedQuery, sources);

    if (llmAnswer) {
      return {
        answer: llmAnswer,
        sources,
        mode: 'llm',
      };
    }

    return {
      answer: this.buildExtractiveAnswer(normalizedQuery, sources),
      sources,
      mode: 'extractive',
    };
  }

  async listSources() {
    const { data, error } = await this.supabase
      .from('knowledge_sources')
      .select('id, title, source_type, version_label, effective_date, document_url, is_active')
      .eq('is_active', true)
      .in('source_type', this.allowedSourceTypes)
      .order('source_type', { ascending: true })
      .order('effective_date', { ascending: false, nullsFirst: false });

    if (error) {
      throw new BadRequestException(`Failed to fetch knowledge sources: ${error.message}`);
    }

    return data || [];
  }

  private async retrieveRelevantChunks(query: string): Promise<KnowledgeChunkRow[]> {
    const terms = this.extractTerms(query);

    const { data, error } = await this.supabase
      .from('knowledge_chunks')
      .select(
        `
        id,
        source_id,
        section_label,
        chunk_text,
        chunk_order,
        source:knowledge_sources!knowledge_chunks_source_id_fkey (
          id,
          title,
          source_type,
          version_label,
          document_url,
          effective_date
        )
      `,
      )
      .eq('is_active', true)
      .textSearch('search_vector', this.toTsQuery(query), {
        type: 'websearch',
        config: 'english',
      })
      .limit(20);

    if (error) {
      this.logger.warn(`Text search failed, falling back to ilike: ${error.message}`);
      return this.retrieveWithFallbackLike(terms);
    }

    const primary = ((data || []) as unknown as KnowledgeChunkRow[])
      .filter((row) => this.allowedSourceTypes.includes(row.source?.source_type))
      .filter((row) => !this.isLowSignalChunk(row.chunk_text));

    if (primary.length >= 5) {
      return primary.slice(0, 12);
    }

    const fallback = await this.retrieveWithFallbackLike(terms);
    const merged = [...primary, ...fallback];
    const seen = new Set<string>();
    return merged.filter((row) => {
      if (seen.has(row.id)) return false;
      seen.add(row.id);
      return true;
    }).slice(0, 12);
  }

  private async retrieveWithFallbackLike(terms: string[]): Promise<KnowledgeChunkRow[]> {
    if (!terms.length) {
      return [];
    }

    const safeTerms = terms.map((term) => term.replace(/[%,]/g, ' ').trim()).filter(Boolean);
    if (!safeTerms.length) {
      return [];
    }

    const orFilter = safeTerms.map((term) => `chunk_text.ilike.%${term}%`).join(',');

    const { data, error } = await this.supabase
      .from('knowledge_chunks')
      .select(
        `
        id,
        source_id,
        section_label,
        chunk_text,
        chunk_order,
        source:knowledge_sources!knowledge_chunks_source_id_fkey (
          id,
          title,
          source_type,
          version_label,
          document_url,
          effective_date
        )
      `,
      )
      .eq('is_active', true)
      .or(orFilter)
      .limit(30);

    if (error) {
      throw new BadRequestException(`Failed to retrieve knowledge chunks: ${error.message}`);
    }

    return ((data || []) as unknown as KnowledgeChunkRow[])
      .filter((row) => this.allowedSourceTypes.includes(row.source?.source_type))
      .filter((row) => !this.isLowSignalChunk(row.chunk_text));
  }

  private buildCitations(query: string, chunks: KnowledgeChunkRow[]): KnowledgeSourceCitation[] {
    const terms = this.extractTerms(query);

    const ranked = chunks
      .map((chunk) => {
        const text = chunk.chunk_text || '';
        const termScore = terms.length
          ? terms.reduce((acc, term) => (text.toLowerCase().includes(term) ? acc + 1 : acc), 0) /
            terms.length
          : 0;

        const section = chunk.section_label || `Chunk ${chunk.chunk_order + 1}`;
        const sectionLower = section.toLowerCase();
        const sectionBoost =
          terms.length && terms.some((term) => sectionLower.includes(term))
            ? 0.35
            : sectionLower === 'general'
              ? -0.2
              : 0.1;

        return {
          sourceId: chunk.source.id,
          title: chunk.source.title,
          sourceType: chunk.source.source_type,
          section,
          excerpt: this.cleanExcerpt(text, terms),
          url: chunk.source.document_url,
          score: Math.max(0, termScore + sectionBoost),
        };
      })
      .sort((a, b) => b.score - a.score);

    const focused = ranked.filter((r) => r.section.toLowerCase() !== 'general');
    return (focused.length ? focused : ranked).slice(0, 5);
  }

  private buildExtractiveAnswer(query: string, sources: KnowledgeSourceCitation[]): string {
    const terms = this.extractTerms(query);
    const prioritized = [...sources].sort((a, b) => b.score - a.score);

    // High-value direct definition shortcut for common baseline query.
    if (/\bwhat\s+is\s+cdf\b|\bdefine\s+cdf\b/i.test(query)) {
      const definition = prioritized
        .flatMap((source) => this.extractRelevantSentences(source.excerpt, ['constituency', 'development', 'fund']))
        .find((sentence) =>
          /constituency development fund/i.test(sentence) && !this.isNoisySentence(sentence),
        );

      if (definition) {
        return `CDF means the Constituency Development Fund, established to finance community-prioritized local development projects at constituency level in Zambia.`;
      }
    }

    const selectedSentences = prioritized
      .flatMap((source) => this.extractRelevantSentences(source.excerpt, terms))
      .filter(
        (sentence, index, arr) =>
          sentence.length > 30 &&
          !this.isNoisySentence(sentence) &&
          arr.indexOf(sentence) === index,
      )
      .slice(0, 3);

    if (selectedSentences.length === 0) {
      const top = prioritized.find((source) => !this.isNoisySentence(source.excerpt)) || prioritized[0];
      if (!top) {
        return 'I could not find a reliable clause for that question in current sources.';
      }

      return `From ${top.title} (${top.section}): ${top.excerpt}`;
    }

    return selectedSentences.join('\n\n');
  }

  private async tryGenerateWithLlm(
    query: string,
    sources: KnowledgeSourceCitation[],
  ): Promise<string | null> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    const model = this.configService.get<string>('AI_KNOWLEDGE_MODEL', 'gpt-4o-mini');

    if (!apiKey) {
      return null;
    }

    try {
      const context = sources
        .map(
          (source, index) =>
            `[${index + 1}] ${source.title} | ${source.section}\n${source.excerpt}`,
        )
        .join('\n\n');

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0,
          messages: [
            {
              role: 'system',
              content:
                'You are a CDF policy assistant. Answer using only supplied context from CDF Act, Guidelines, and Circulars. If context is insufficient, say so clearly.',
            },
            {
              role: 'user',
              content: `Question: ${query}\n\nContext:\n${context}`,
            },
          ],
        }),
      });

      if (!response.ok) {
        this.logger.warn(`LLM request failed with status ${response.status}`);
        return null;
      }

      const payload = (await response.json()) as any;
      const answer = payload?.choices?.[0]?.message?.content?.trim();
      return answer || null;
    } catch (error) {
      this.logger.warn(`LLM generation failed: ${(error as Error).message}`);
      return null;
    }
  }

  private isCdfDefinitionQuery(query: string): boolean {
    const q = query.toLowerCase().trim();
    return (
      /^what\s+is\s+cdf\??$/.test(q) ||
      /^what\s+is\s+cfd\??$/.test(q) ||
      /^define\s+cdf\??$/.test(q)
    );
  }

  private toTsQuery(query: string): string {
    return query.replace(/[&|!:]/g, ' ').trim();
  }

  private extractTerms(query: string): string[] {
    const stopWords = new Set([
      'the',
      'a',
      'an',
      'is',
      'are',
      'what',
      'how',
      'for',
      'and',
      'with',
      'from',
      'that',
      'this',
      'about',
      'under',
      'into',
      'can',
      'does',
      'cdf',
    ]);

    return query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.has(word));
  }

  private extractRelevantSentences(text: string, terms: string[]): string[] {
    const sentences = text
      .replace(/\s+/g, ' ')
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean);

    if (!terms.length) {
      return sentences.slice(0, 1);
    }

    return sentences
      .filter((sentence) => terms.some((term) => sentence.toLowerCase().includes(term)))
      .slice(0, 2);
  }

  private isLowSignalChunk(text: string): boolean {
    const t = (text || '').replace(/\s+/g, ' ').trim();
    if (!t) return true;

    // Common table-of-contents / index patterns
    if (/\.{4,}/.test(t)) return true;
    if (/\bPART\s+[IVXLC]+\b.*\.{3,}/i.test(t)) return true;

    const alpha = (t.match(/[A-Za-z]/g) || []).length;
    const digits = (t.match(/[0-9]/g) || []).length;
    const punct = (t.match(/[.,;:()\[\]{}\-_/]/g) || []).length;

    // Very low letter density or very high punctuation/digit density tends to be noisy scans/contents.
    const letterRatio = alpha / Math.max(t.length, 1);
    const noiseRatio = (digits + punct) / Math.max(t.length, 1);

    return letterRatio < 0.45 || noiseRatio > 0.35;
  }

  private isNoisySentence(text: string): boolean {
    const t = (text || '').replace(/\s+/g, ' ').trim();
    if (!t) return true;
    if (t.length < 25) return true;
    if (/\.{3,}/.test(t)) return true;
    if (/\bBOQ\b|\bCBO\b|\bCSO\b|\bDDCC\b|\bDPO\b|\bDPU\b/i.test(t) && t.length < 220)
      return true;
    return false;
  }

  private cleanExcerpt(text: string, terms: string[]): string {
    const trimmed = text.replace(/\s+/g, ' ').trim();
    if (trimmed.length <= 420) {
      return trimmed;
    }

    const lower = trimmed.toLowerCase();
    const firstHit = terms
      .map((term) => lower.indexOf(term))
      .filter((idx) => idx >= 0)
      .sort((a, b) => a - b)[0];

    if (firstHit === undefined) {
      return `${trimmed.slice(0, 417)}...`;
    }

    const radius = 200;
    const start = Math.max(0, firstHit - radius);
    const end = Math.min(trimmed.length, firstHit + radius + 120);
    const snippet = trimmed.slice(start, end).trim();
    return `${start > 0 ? '... ' : ''}${snippet}${end < trimmed.length ? ' ...' : ''}`;
  }
}
