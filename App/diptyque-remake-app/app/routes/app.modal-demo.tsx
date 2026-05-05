import { useState } from "react";
import {
  BlockStack,
  Box,
  Button,
  Card,
  InlineStack,
  Layout,
  Page,
  Text,
  TextField,
} from "@shopify/polaris";
import { AppModal } from "../components/common/AppModal";

// ─── Demo page ────────────────────────────────────────────────────────────────

export default function ModalDemoPage() {
  // ── Basic confirmation modal ──────────────────────────────────────────────
  const [confirmOpen, setConfirmOpen] = useState(false);

  // ── Destructive modal ─────────────────────────────────────────────────────
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = () => {
    setDeleting(true);
    setTimeout(() => {
      setDeleting(false);
      setDeleteOpen(false);
    }, 2000);
  };

  // ── Form modal ────────────────────────────────────────────────────────────
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setFormOpen(false);
      setName("");
    }, 1500);
  };

  // ── Info-only modal (no confirm button) ───────────────────────────────────
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <Page title="AppModal Demo" backAction={{ content: "Home", url: "/app" }}>
      <Layout>
        {/* ── Intro ──────────────────────────────────────────────────────── */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Reusable AppModal component
              </Text>
              <Text as="p" tone="subdued">
                The <code>AppModal</code> component wraps Polaris{" "}
                <code>Modal</code> and provides a consistent API for all popup
                dialogs in the app. It supports confirmation flows, forms,
                destructive actions, loading states, and info-only displays.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* ── Variants ───────────────────────────────────────────────────── */}
        <Layout.Section>
          <BlockStack gap="400">
            {/* Basic confirmation */}
            <Card>
              <BlockStack gap="300">
                <Text as="h3" variant="headingSm">
                  Basic confirmation
                </Text>
                <Text as="p" tone="subdued">
                  Use when you need the user to acknowledge an action before
                  proceeding.
                </Text>
                <Box>
                  <Button onClick={() => setConfirmOpen(true)}>
                    Open confirmation modal
                  </Button>
                </Box>
              </BlockStack>
            </Card>

            {/* Destructive action */}
            <Card>
              <BlockStack gap="300">
                <Text as="h3" variant="headingSm">
                  Destructive action
                </Text>
                <Text as="p" tone="subdued">
                  Use <code>primaryActionDestructive</code> for irreversible
                  operations like deleting records.
                </Text>
                <Box>
                  <Button tone="critical" onClick={() => setDeleteOpen(true)}>
                    Open destructive modal
                  </Button>
                </Box>
              </BlockStack>
            </Card>

            {/* Form content */}
            <Card>
              <BlockStack gap="300">
                <Text as="h3" variant="headingSm">
                  Form content via children
                </Text>
                <Text as="p" tone="subdued">
                  Pass any JSX as <code>children</code> to render custom content
                  inside the modal body.
                </Text>
                <Box>
                  <Button onClick={() => setFormOpen(true)}>
                    Open form modal
                  </Button>
                </Box>
              </BlockStack>
            </Card>

            {/* Info-only */}
            <Card>
              <BlockStack gap="300">
                <Text as="h3" variant="headingSm">
                  Info only (no confirm action)
                </Text>
                <Text as="p" tone="subdued">
                  Omit <code>onConfirm</code> to hide the primary action button,
                  leaving only the secondary close button.
                </Text>
                <Box>
                  <Button variant="plain" onClick={() => setInfoOpen(true)}>
                    Open info modal
                  </Button>
                </Box>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>

        {/* ── Usage snippet ───────────────────────────────────────────────── */}
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">
                Usage
              </Text>
              <Text as="p" tone="subdued">
                Import <code>AppModal</code> from{" "}
                <code>~/components/common/AppModal</code> and control visibility
                with a boolean state variable.
              </Text>
              <Box
                background="bg-surface-secondary"
                padding="400"
                borderRadius="200"
              >
                <Text as="p" variant="bodyMd">
                  <pre
                    style={{
                      margin: 0,
                      fontFamily: "monospace",
                      whiteSpace: "pre-wrap",
                      fontSize: "0.85rem",
                    }}
                  >{`import { useState } from "react";
import { AppModal } from "~/components/common/AppModal";

function MyPage() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open</Button>

      <AppModal
        open={open}
        title="Confirm action"
        description="Are you sure you want to proceed?"
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        primaryActionLabel="Confirm"
        secondaryActionLabel="Cancel"
      />
    </>
  );
}`}</pre>
                </Text>
              </Box>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      {/* ── Modal instances ─────────────────────────────────────────────── */}

      {/* 1. Basic confirmation */}
      <AppModal
        open={confirmOpen}
        title="Confirm action"
        description="Are you sure you want to proceed with this action? Please review before confirming."
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => setConfirmOpen(false)}
        primaryActionLabel="Confirm"
        secondaryActionLabel="Cancel"
      />

      {/* 2. Destructive */}
      <AppModal
        open={deleteOpen}
        title="Delete record"
        description='Are you sure you want to permanently delete "Example Record"? This action cannot be undone.'
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        primaryActionLabel="Delete"
        secondaryActionLabel="Keep it"
        primaryActionDestructive
      />

      {/* 3. Form with children */}
      <AppModal
        open={formOpen}
        title="Edit name"
        onClose={() => {
          setFormOpen(false);
          setName("");
        }}
        onConfirm={handleSave}
        loading={saving}
        primaryActionLabel="Save"
        primaryActionDisabled={name.trim() === ""}
      >
        <TextField
          label="Name"
          value={name}
          onChange={setName}
          autoComplete="off"
          placeholder="Enter a name…"
        />
      </AppModal>

      {/* 4. Info-only */}
      <AppModal
        open={infoOpen}
        title="About this feature"
        description="This feature lets you schedule products for automatic publishing. Once scheduled, the product will be made active at the chosen date and time (GMT+7). You can cancel a scheduled publish at any time before it runs."
        onClose={() => setInfoOpen(false)}
        secondaryActionLabel="Got it"
      />
    </Page>
  );
}
