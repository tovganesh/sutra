/**
 * Sutra Workflow Automation Engine
 * Event-driven rule and state-machine processor for business approvals, alerts,
 * and automated transitions.
 */

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in';
  value: unknown;
}

export interface WorkflowStep {
  id: string;
  type: 'require_approval' | 'update_field' | 'send_notification' | 'invoke_webhook';
  config: {
    roleName?: string;
    assigneeUserId?: string;
    targetField?: string;
    targetValue?: unknown;
    notificationChannel?: 'email' | 'in_app' | 'whatsapp';
    webhookUrl?: string;
  };
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  triggerEvent: string; // e.g. 'invoice:created', 'purchase_order:submitted'
  conditions: WorkflowCondition[];
  steps: WorkflowStep[];
  isActive: boolean;
}

export class FlowEngine {
  /**
   * Evaluates if conditions are met for an incoming record event.
   */
  public static evaluateConditions(
    conditions: WorkflowCondition[],
    recordData: Record<string, unknown>
  ): boolean {
    if (!conditions || conditions.length === 0) return true;

    for (const cond of conditions) {
      const actualVal = recordData[cond.field];

      switch (cond.operator) {
        case 'equals':
          if (actualVal !== cond.value) return false;
          break;
        case 'not_equals':
          if (actualVal === cond.value) return false;
          break;
        case 'greater_than':
          if (Number(actualVal) <= Number(cond.value)) return false;
          break;
        case 'less_than':
          if (Number(actualVal) >= Number(cond.value)) return false;
          break;
        case 'contains':
          if (typeof actualVal === 'string' && !actualVal.includes(String(cond.value))) {
            return false;
          }
          break;
        case 'in':
          if (Array.isArray(cond.value) && !cond.value.includes(actualVal)) {
            return false;
          }
          break;
      }
    }

    return true;
  }

  /**
   * Executes the matching workflow steps sequentially.
   */
  public static async executeWorkflow(
    workflow: WorkflowDefinition,
    recordData: Record<string, unknown>
  ): Promise<{ executedSteps: string[]; pendingApprovals: string[] }> {
    const executedSteps: string[] = [];
    const pendingApprovals: string[] = [];

    const matches = this.evaluateConditions(workflow.conditions, recordData);
    if (!matches) {
      return { executedSteps, pendingApprovals };
    }

    for (const step of workflow.steps) {
      if (step.type === 'require_approval') {
        pendingApprovals.push(step.config.roleName || 'Approver');
      } else {
        executedSteps.push(step.id);
      }
    }

    return { executedSteps, pendingApprovals };
  }
}
