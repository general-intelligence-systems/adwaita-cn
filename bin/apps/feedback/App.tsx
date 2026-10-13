// The same feedback screen as app.rb beside this, from the registry.

import { Banner } from "@/ui/banner"
import { Box } from "@/ui/box"
import { Button } from "@/ui/button"
import { HeaderBar } from "@/ui/header-bar"
import { StatusPage } from "@/ui/status-page"
import { ToastOverlay } from "@/ui/toast-overlay"
import { ToolbarView } from "@/ui/toolbar-view"
import { WindowTitle } from "@/ui/window-title"

export default function FeedbackApp() {
  return (
    <ToolbarView
      content={
        <ToastOverlay>
          <Box orientation="vertical">
            <Banner title="You are working offline" buttonLabel="Reconnect" revealed />
            <StatusPage
              iconName="folder-symbolic"
              title="No documents"
              description="Documents you create will appear here."
              className="grow"
            >
              <Button size="pill" variant="suggestedAction" label="New document" />
            </StatusPage>
          </Box>
        </ToastOverlay>
      }
    >
      <HeaderBar titleWidget={<WindowTitle title="Feedback" subtitle="Banner, toast, empty state" />} />
    </ToolbarView>
  )
}
