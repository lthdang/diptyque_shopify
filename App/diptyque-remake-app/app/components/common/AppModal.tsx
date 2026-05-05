import type { ReactNode } from "react";
import { BlockStack, Modal, Text } from "@shopify/polaris";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AppModalProps {
  /** Whether the modal is visible. */
  open: boolean;
  /** Modal title shown in the header bar. */
  title: string;
  /** Optional short description rendered above `children`. */
  description?: string;
  /** Callback fired when the modal requests to be closed (X button, backdrop, Escape key). */
  onClose: () => void;
  /** Callback fired when the primary action button is clicked. */
  onConfirm?: () => void;
  /** Shows a loading spinner on the primary action button and disables it. */
  loading?: boolean;
  /** Arbitrary content rendered inside the modal body. */
  children?: ReactNode;
  /** Label for the primary (confirm) button. Defaults to "Confirm". */
  primaryActionLabel?: string;
  /** Label for the secondary (close/cancel) button. Defaults to "Cancel". */
  secondaryActionLabel?: string;
  /** When true the primary action button is rendered as destructive (red). */
  primaryActionDestructive?: boolean;
  /** When true the primary action button is disabled regardless of `loading`. */
  primaryActionDisabled?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * `AppModal` — a reusable Polaris-based modal for the Diptyque Shopify app.
 *
 * @example Basic confirmation dialog
 * ```tsx
 * <AppModal
 *   open={isOpen}
 *   title="Delete item"
 *   description="This action cannot be undone."
 *   onClose={() => setIsOpen(false)}
 *   onConfirm={handleDelete}
 *   primaryActionLabel="Delete"
 *   primaryActionDestructive
 * />
 * ```
 *
 * @example With custom content
 * ```tsx
 * <AppModal
 *   open={isOpen}
 *   title="Edit details"
 *   onClose={() => setIsOpen(false)}
 *   onConfirm={handleSave}
 *   loading={isSaving}
 *   primaryActionLabel="Save"
 * >
 *   <TextField label="Name" value={name} onChange={setName} autoComplete="off" />
 * </AppModal>
 * ```
 */
export function AppModal({
  open,
  title,
  description,
  onClose,
  onConfirm,
  loading = false,
  children,
  primaryActionLabel = "Confirm",
  secondaryActionLabel = "Cancel",
  primaryActionDestructive = false,
  primaryActionDisabled = false,
}: AppModalProps) {
  const primaryAction = onConfirm
    ? {
        content: loading ? `${primaryActionLabel}…` : primaryActionLabel,
        onAction: onConfirm,
        loading,
        disabled: loading || primaryActionDisabled,
        destructive: primaryActionDestructive,
      }
    : undefined;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      primaryAction={primaryAction}
      secondaryActions={[{ content: secondaryActionLabel, onAction: onClose }]}
    >
      <Modal.Section>
        <BlockStack gap="400">
          {description && (
            <Text as="p" variant="bodyMd">
              {description}
            </Text>
          )}
          {children}
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}
