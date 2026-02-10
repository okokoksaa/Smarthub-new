/**
 * Project State Machine
 * Defines all valid states and transitions for CDF projects
 */

export type ProjectStatus =
  | 'draft'
  | 'submitted'
  | 'cdfc_review'
  | 'tac_appraisal'
  | 'plgo_review'
  | 'approved'
  | 'implementation'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export type ProjectTransitionAction =
  | 'submit'
  | 'accept_for_review'
  | 'forward_to_tac'
  | 'recommend_approval'
  | 'approve'
  | 'reject'
  | 'start_implementation'
  | 'complete'
  | 'cancel'
  | 'revise';

export interface ProjectTransition {
  from: ProjectStatus;
  to: ProjectStatus;
  action: ProjectTransitionAction;
  requiredRoles: string[];
  requiresComment: boolean;
  notificationEvent: string;
}

export const PROJECT_TRANSITIONS: ProjectTransition[] = [
  // Draft -> Submitted
  {
    from: 'draft',
    to: 'submitted',
    action: 'submit',
    requiredRoles: ['cdfc_member', 'wdc_member', 'citizen', 'cdfc_chair', 'super_admin'],
    requiresComment: false,
    notificationEvent: 'project.submitted',
  },
  // Submitted -> CDFC Review
  {
    from: 'submitted',
    to: 'cdfc_review',
    action: 'accept_for_review',
    requiredRoles: ['cdfc_chair', 'super_admin'],
    requiresComment: false,
    notificationEvent: 'project.accepted_for_review',
  },
  // Submitted -> Rejected
  {
    from: 'submitted',
    to: 'rejected',
    action: 'reject',
    requiredRoles: ['cdfc_chair', 'super_admin'],
    requiresComment: true,
    notificationEvent: 'project.rejected',
  },
  // CDFC Review -> TAC Appraisal
  {
    from: 'cdfc_review',
    to: 'tac_appraisal',
    action: 'forward_to_tac',
    requiredRoles: ['cdfc_chair', 'super_admin'],
    requiresComment: false,
    notificationEvent: 'project.forwarded_to_tac',
  },
  // CDFC Review -> Rejected
  {
    from: 'cdfc_review',
    to: 'rejected',
    action: 'reject',
    requiredRoles: ['cdfc_chair', 'super_admin'],
    requiresComment: true,
    notificationEvent: 'project.rejected',
  },
  // TAC Appraisal -> PLGO Review
  {
    from: 'tac_appraisal',
    to: 'plgo_review',
    action: 'recommend_approval',
    requiredRoles: ['tac_chair', 'tac_member', 'super_admin'],
    requiresComment: false,
    notificationEvent: 'project.recommended_for_approval',
  },
  // TAC Appraisal -> Rejected
  {
    from: 'tac_appraisal',
    to: 'rejected',
    action: 'reject',
    requiredRoles: ['tac_chair', 'tac_member', 'super_admin'],
    requiresComment: true,
    notificationEvent: 'project.rejected',
  },
  // PLGO Review -> Approved
  {
    from: 'plgo_review',
    to: 'approved',
    action: 'approve',
    requiredRoles: ['plgo', 'ministry_official', 'super_admin'],
    requiresComment: false,
    notificationEvent: 'project.approved',
  },
  // PLGO Review -> Rejected
  {
    from: 'plgo_review',
    to: 'rejected',
    action: 'reject',
    requiredRoles: ['plgo', 'ministry_official', 'super_admin'],
    requiresComment: true,
    notificationEvent: 'project.rejected',
  },
  // Approved -> Implementation
  {
    from: 'approved',
    to: 'implementation',
    action: 'start_implementation',
    requiredRoles: ['plgo', 'finance_officer', 'super_admin'],
    requiresComment: false,
    notificationEvent: 'project.implementation_started',
  },
  // Implementation -> Completed
  {
    from: 'implementation',
    to: 'completed',
    action: 'complete',
    requiredRoles: ['plgo', 'cdfc_chair', 'super_admin'],
    requiresComment: false,
    notificationEvent: 'project.completed',
  },
  // Implementation -> Cancelled
  {
    from: 'implementation',
    to: 'cancelled',
    action: 'cancel',
    requiredRoles: ['plgo', 'ministry_official', 'super_admin'],
    requiresComment: true,
    notificationEvent: 'project.cancelled',
  },
  // Rejected -> Draft (Revise and Resubmit)
  {
    from: 'rejected',
    to: 'draft',
    action: 'revise',
    requiredRoles: ['cdfc_member', 'wdc_member', 'cdfc_chair', 'super_admin'],
    requiresComment: false,
    notificationEvent: 'project.revision_started',
  },
];

export class ProjectStateMachine {
  /**
   * Check if a transition is valid
   */
  static isValidTransition(from: ProjectStatus, to: ProjectStatus): boolean {
    return PROJECT_TRANSITIONS.some(t => t.from === from && t.to === to);
  }

  /**
   * Get the transition definition
   */
  static getTransition(from: ProjectStatus, to: ProjectStatus): ProjectTransition | null {
    return PROJECT_TRANSITIONS.find(t => t.from === from && t.to === to) || null;
  }

  /**
   * Get all valid next states from current state
   */
  static getNextStates(currentStatus: ProjectStatus): ProjectStatus[] {
    return PROJECT_TRANSITIONS
      .filter(t => t.from === currentStatus)
      .map(t => t.to);
  }

  /**
   * Get all valid transitions from current state for a user's roles
   */
  static getAvailableTransitions(currentStatus: ProjectStatus, userRoles: string[]): ProjectTransition[] {
    return PROJECT_TRANSITIONS.filter(
      t => t.from === currentStatus && t.requiredRoles.some(r => userRoles.includes(r)),
    );
  }

  /**
   * Check if user can perform transition
   */
  static canUserTransition(
    from: ProjectStatus,
    to: ProjectStatus,
    userRoles: string[],
  ): boolean {
    const transition = this.getTransition(from, to);
    if (!transition) return false;
    return transition.requiredRoles.some(r => userRoles.includes(r));
  }

  /**
   * Get human-readable status label
   */
  static getStatusLabel(status: ProjectStatus): string {
    const labels: Record<ProjectStatus, string> = {
      draft: 'Draft',
      submitted: 'Submitted',
      cdfc_review: 'CDFC Review',
      tac_appraisal: 'TAC Appraisal',
      plgo_review: 'PLGO Review',
      approved: 'Approved',
      implementation: 'Implementation',
      completed: 'Completed',
      rejected: 'Rejected',
      cancelled: 'Cancelled',
    };
    return labels[status];
  }

  /**
   * Get action label for transition
   */
  static getActionLabel(from: ProjectStatus, to: ProjectStatus): string {
    const transition = this.getTransition(from, to);
    if (!transition) return 'Unknown Action';

    const labels: Record<ProjectTransitionAction, string> = {
      submit: 'Submit for Review',
      accept_for_review: 'Accept for CDFC Review',
      forward_to_tac: 'Forward to TAC',
      recommend_approval: 'Recommend Approval',
      approve: 'Approve Project',
      reject: 'Reject',
      start_implementation: 'Start Implementation',
      complete: 'Mark Complete',
      cancel: 'Cancel Project',
      revise: 'Revise & Resubmit',
    };
    return labels[transition.action];
  }
}
