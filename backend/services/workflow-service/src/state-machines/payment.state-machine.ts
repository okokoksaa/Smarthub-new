/**
 * Payment State Machine
 * Defines all valid states and transitions for CDF payments
 * Implements Two-Panel Authorization system
 */

export type PaymentStatus =
  | 'pending'
  | 'panel_a_approved'
  | 'panel_a_rejected'
  | 'panel_b_approved'
  | 'approved'
  | 'rejected'
  | 'disbursed'
  | 'cancelled';

export type PaymentTransitionAction =
  | 'approve_panel_a'
  | 'reject_panel_a'
  | 'approve_panel_b'
  | 'reject_panel_b'
  | 'disburse'
  | 'cancel';

export interface PaymentTransition {
  from: PaymentStatus;
  to: PaymentStatus;
  action: PaymentTransitionAction;
  requiredRoles: string[];
  requiresComment: boolean;
  notificationEvent: string;
  panel?: 'A' | 'B';
}

// Panel A: MP, CDFC Chair, Finance Officer
const PANEL_A_ROLES = ['mp', 'cdfc_chair', 'finance_officer', 'super_admin'];

// Panel B: PLGO, Ministry Official
const PANEL_B_ROLES = ['plgo', 'ministry_official', 'super_admin'];

export const PAYMENT_TRANSITIONS: PaymentTransition[] = [
  // Pending -> Panel A Approved
  {
    from: 'pending',
    to: 'panel_a_approved',
    action: 'approve_panel_a',
    requiredRoles: PANEL_A_ROLES,
    requiresComment: false,
    notificationEvent: 'payment.panel_a_approved',
    panel: 'A',
  },
  // Pending -> Panel A Rejected
  {
    from: 'pending',
    to: 'panel_a_rejected',
    action: 'reject_panel_a',
    requiredRoles: PANEL_A_ROLES,
    requiresComment: true,
    notificationEvent: 'payment.panel_a_rejected',
    panel: 'A',
  },
  // Panel A Approved -> Approved (Panel B approval)
  {
    from: 'panel_a_approved',
    to: 'approved',
    action: 'approve_panel_b',
    requiredRoles: PANEL_B_ROLES,
    requiresComment: false,
    notificationEvent: 'payment.approved',
    panel: 'B',
  },
  // Panel A Approved -> Rejected (Panel B rejection)
  {
    from: 'panel_a_approved',
    to: 'rejected',
    action: 'reject_panel_b',
    requiredRoles: PANEL_B_ROLES,
    requiresComment: true,
    notificationEvent: 'payment.rejected',
    panel: 'B',
  },
  // Approved -> Disbursed
  {
    from: 'approved',
    to: 'disbursed',
    action: 'disburse',
    requiredRoles: ['finance_officer', 'super_admin'],
    requiresComment: false,
    notificationEvent: 'payment.disbursed',
  },
  // Any active state -> Cancelled
  {
    from: 'pending',
    to: 'cancelled',
    action: 'cancel',
    requiredRoles: ['finance_officer', 'cdfc_chair', 'super_admin'],
    requiresComment: true,
    notificationEvent: 'payment.cancelled',
  },
  {
    from: 'panel_a_approved',
    to: 'cancelled',
    action: 'cancel',
    requiredRoles: ['plgo', 'ministry_official', 'super_admin'],
    requiresComment: true,
    notificationEvent: 'payment.cancelled',
  },
];

export class PaymentStateMachine {
  /**
   * Check if a transition is valid
   */
  static isValidTransition(from: PaymentStatus, to: PaymentStatus): boolean {
    return PAYMENT_TRANSITIONS.some(t => t.from === from && t.to === to);
  }

  /**
   * Get the transition definition
   */
  static getTransition(from: PaymentStatus, to: PaymentStatus): PaymentTransition | null {
    return PAYMENT_TRANSITIONS.find(t => t.from === from && t.to === to) || null;
  }

  /**
   * Get all valid next states from current state
   */
  static getNextStates(currentStatus: PaymentStatus): PaymentStatus[] {
    return PAYMENT_TRANSITIONS
      .filter(t => t.from === currentStatus)
      .map(t => t.to);
  }

  /**
   * Get all valid transitions from current state for a user's roles
   */
  static getAvailableTransitions(currentStatus: PaymentStatus, userRoles: string[]): PaymentTransition[] {
    return PAYMENT_TRANSITIONS.filter(
      t => t.from === currentStatus && t.requiredRoles.some(r => userRoles.includes(r)),
    );
  }

  /**
   * Check if user can perform transition
   */
  static canUserTransition(
    from: PaymentStatus,
    to: PaymentStatus,
    userRoles: string[],
  ): boolean {
    const transition = this.getTransition(from, to);
    if (!transition) return false;
    return transition.requiredRoles.some(r => userRoles.includes(r));
  }

  /**
   * Validate Two-Panel Authorization rules
   * Same user cannot approve both panels
   */
  static validateTwoPanelAuth(
    panelAApprover: string | null,
    panelBApprover: string,
  ): { valid: boolean; error?: string } {
    if (panelAApprover && panelAApprover === panelBApprover) {
      return {
        valid: false,
        error: 'Same user cannot approve both Panel A and Panel B',
      };
    }
    return { valid: true };
  }

  /**
   * Check if Panel B can be approved (Panel A must be approved first)
   */
  static canApprovePanelB(currentStatus: PaymentStatus): boolean {
    return currentStatus === 'panel_a_approved';
  }

  /**
   * Get human-readable status label
   */
  static getStatusLabel(status: PaymentStatus): string {
    const labels: Record<PaymentStatus, string> = {
      pending: 'Pending Approval',
      panel_a_approved: 'Panel A Approved',
      panel_a_rejected: 'Panel A Rejected',
      panel_b_approved: 'Panel B Approved',
      approved: 'Fully Approved',
      rejected: 'Rejected',
      disbursed: 'Disbursed',
      cancelled: 'Cancelled',
    };
    return labels[status];
  }

  /**
   * Get action label for transition
   */
  static getActionLabel(action: PaymentTransitionAction): string {
    const labels: Record<PaymentTransitionAction, string> = {
      approve_panel_a: 'Approve (Panel A)',
      reject_panel_a: 'Reject (Panel A)',
      approve_panel_b: 'Approve (Panel B)',
      reject_panel_b: 'Reject (Panel B)',
      disburse: 'Disburse Payment',
      cancel: 'Cancel Payment',
    };
    return labels[action];
  }

  /**
   * Get panel roles
   */
  static getPanelARoles(): string[] {
    return [...PANEL_A_ROLES];
  }

  static getPanelBRoles(): string[] {
    return [...PANEL_B_ROLES];
  }
}
