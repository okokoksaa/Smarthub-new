import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class QueryProcessorService {
  private readonly logger = new Logger(QueryProcessorService.name);

  // Intent classification keywords
  private readonly intentKeywords: Record<string, string[]> = {
    project_status: ['project', 'status', 'progress', 'completion', 'milestone', 'stage'],
    budget_query: ['budget', 'allocation', 'spending', 'utilization', 'remaining', 'funds', 'money'],
    payment_history: ['payment', 'disbursement', 'voucher', 'paid', 'transaction', 'transfer'],
    compliance_check: ['compliance', 'document', 'deadline', 'overdue', 'missing', 'required', 'audit'],
    risk_assessment: ['risk', 'flag', 'anomaly', 'concern', 'review', 'warning', 'issue'],
    general: ['what', 'how', 'when', 'who', 'help', 'show', 'tell'],
  };

  /**
   * Classify the intent of a user query
   */
  classifyIntent(query: string): string {
    const lowerQuery = query.toLowerCase();
    let maxScore = 0;
    let detectedIntent = 'general';

    for (const [intent, keywords] of Object.entries(this.intentKeywords)) {
      const score = keywords.filter(keyword => lowerQuery.includes(keyword)).length;
      if (score > maxScore) {
        maxScore = score;
        detectedIntent = intent;
      }
    }

    this.logger.debug(`Query: "${query}" => Intent: ${detectedIntent} (score: ${maxScore})`);
    return detectedIntent;
  }

  /**
   * Generate a response based on intent and data
   */
  generateResponse(intent: string, query: string, contextData: any): string {
    switch (intent) {
      case 'project_status':
        return this.generateProjectStatusResponse(contextData);
      case 'budget_query':
        return this.generateBudgetResponse(contextData);
      case 'payment_history':
        return this.generatePaymentResponse(contextData);
      case 'compliance_check':
        return this.generateComplianceResponse(contextData);
      case 'risk_assessment':
        return this.generateRiskResponse(contextData);
      default:
        return this.generateGeneralResponse(query, contextData);
    }
  }

  private generateProjectStatusResponse(data: any): string {
    if (!data.project) {
      return 'I don\'t have a specific project in context. Could you select a project or tell me which project you\'re asking about?';
    }

    const p = data.project;
    const spentPercentage = p.budget > 0 ? Math.round((p.spent / p.budget) * 100) : 0;

    return `**Project: ${p.name}**\n\n` +
      `- **Status:** ${this.formatStatus(p.status)}\n` +
      `- **Progress:** ${p.progress}%\n` +
      `- **Budget:** K${p.budget?.toLocaleString() || 0}\n` +
      `- **Spent:** K${p.spent?.toLocaleString() || 0} (${spentPercentage}%)\n\n` +
      `_Note: This is advisory information. Please verify details in the official project record._`;
  }

  private generateBudgetResponse(data: any): string {
    if (!data.budget) {
      return 'Budget information is not available for the current context. Please ensure a constituency is selected.';
    }

    const b = data.budget;
    const utilization = b.total_allocation > 0
      ? Math.round((b.disbursed_amount / b.total_allocation) * 100)
      : 0;

    return `**Budget Summary for ${b.fiscal_year}**\n\n` +
      `- **Total Allocation:** K${b.total_allocation?.toLocaleString() || 0}\n` +
      `- **Disbursed:** K${b.disbursed_amount?.toLocaleString() || 0}\n` +
      `- **Utilization Rate:** ${utilization}%\n` +
      `- **Remaining:** K${((b.total_allocation || 0) - (b.disbursed_amount || 0)).toLocaleString()}\n\n` +
      `_Budget figures are advisory. Official records may differ._`;
  }

  private generatePaymentResponse(data: any): string {
    if (!data.payments?.length) {
      return 'No payment records found for the current context.';
    }

    const payments = data.payments;
    const totalPaid = payments
      .filter((p: any) => p.status === 'executed' || p.status === 'disbursed')
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

    let response = `**Payment Summary**\n\n`;
    response += `- **Total Transactions:** ${payments.length}\n`;
    response += `- **Total Disbursed:** K${totalPaid.toLocaleString()}\n\n`;
    response += `**Recent Payments:**\n`;

    payments.slice(0, 5).forEach((p: any, i: number) => {
      response += `${i + 1}. K${p.amount?.toLocaleString() || 0} - ${this.formatStatus(p.status)} (${new Date(p.created_at).toLocaleDateString()})\n`;
    });

    response += `\n_Payment information is advisory. Verify with finance records._`;
    return response;
  }

  private generateComplianceResponse(data: any): string {
    if (!data.compliance) {
      return 'Unable to retrieve compliance information at this time.';
    }

    const c = data.compliance;
    if (c.issues?.length === 0) {
      return '**Compliance Status: ✅ Good**\n\n' +
        'No compliance issues detected. All required documents and deadlines appear to be in order.\n\n' +
        '_This is an automated check. Please verify with the compliance officer._';
    }

    let response = '**Compliance Status: ⚠️ Issues Found**\n\n';
    c.issues.forEach((issue: string, i: number) => {
      response += `${i + 1}. ${issue}\n`;
    });
    response += '\n_Please address these issues promptly. Contact the compliance officer for assistance._';
    return response;
  }

  private generateRiskResponse(data: any): string {
    return '**Risk Assessment**\n\n' +
      'I can help analyze risk factors for projects and payments. To provide specific risk insights, please:\n\n' +
      '1. Select a specific project or payment\n' +
      '2. Ask about specific risk factors\n' +
      '3. Request a risk score calculation\n\n' +
      '_Risk assessments are advisory. All risk-based decisions require human review._';
  }

  private generateGeneralResponse(query: string, data: any): string {
    let response = 'Hello! I\'m the CDF Smart Hub AI Assistant. I can help you with:\n\n';
    response += '- **Project Status** - Check progress, milestones, and details\n';
    response += '- **Budget Information** - View allocations and spending\n';
    response += '- **Payment History** - Track disbursements and transactions\n';
    response += '- **Compliance Checks** - Review document status and deadlines\n';
    response += '- **Risk Assessment** - Analyze project and payment risks\n\n';

    if (data.summary?.project_count) {
      response += `_Your constituency has ${data.summary.project_count} projects on record._\n\n`;
    }

    response += 'What would you like to know more about?';
    return response;
  }

  private formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      draft: '📝 Draft',
      submitted: '📤 Submitted',
      approved: '✅ Approved',
      rejected: '❌ Rejected',
      implementation: '🔨 In Progress',
      completed: '✓ Completed',
      pending: '⏳ Pending',
      executed: '💰 Executed',
      disbursed: '💰 Disbursed',
    };
    return statusMap[status] || status;
  }
}
