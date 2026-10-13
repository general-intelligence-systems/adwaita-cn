// The same software centre as app.rb beside this, from the registry.

import { Assistant } from "@/ui/assistant"
import { Box } from "@/ui/box"
import { Button } from "@/ui/button"
import { ButtonContent } from "@/ui/button-content"
import { ButtonRow } from "@/ui/button-row"
import { HeaderBar } from "@/ui/header-bar"
import { InfoBar } from "@/ui/info-bar"
import { Label } from "@/ui/label"
import { LevelBar } from "@/ui/level-bar"
import { LinkButton } from "@/ui/link-button"
import { PreferencesGroup } from "@/ui/preferences-group"
import { ProgressBar } from "@/ui/progress-bar"
import { ScrolledWindow } from "@/ui/scrolled-window"
import { Spinner } from "@/ui/spinner"
import { StatusPage } from "@/ui/status-page"
import { ToastOverlay } from "@/ui/toast-overlay"
import { ToastWidget } from "@/ui/toast-widget"
import { ToolbarView } from "@/ui/toolbar-view"

export default function SoftwareApp() {
  return (
    <ToolbarView
      content={
        <ToastOverlay>
          <ScrolledWindow>
          <Box orientation="vertical" spacing={12} className="gap-3 m-3">
            <InfoBar messageType="warning" revealed showCloseButton>
              <Label label="This application is not sandboxed." />
            </InfoBar>
            <StatusPage
              iconName="application-x-executable-symbolic"
              title="Inkscape"
              description="A vector graphics editor."
            >
              <Box orientation="horizontal" spacing={12} className="gap-3 self-center">
                <Button size="pill" variant="suggestedAction" label="Install" />
                <LinkButton uri="https://inkscape.org" label="Website" />
              </Box>
            </StatusPage>
            <PreferencesGroup title="Downloading">
              <ProgressBar fraction={0.62} />
              <LevelBar value={0.4} />
              <Spinner className="self-center" />
              <ButtonRow title="Rate this application" startIconName="starred-symbolic" />
            </PreferencesGroup>
          </Box>
          </ScrolledWindow>
          <ToastWidget />
        </ToastOverlay>
      }
    >
      <HeaderBar>
        <Button variant="suggestedAction">
          <ButtonContent iconName="folder-download-symbolic" label="Install" />
        </Button>
      </HeaderBar>
    </ToolbarView>
  )
}

// The assistant which sets the application up after it is installed.
export function Install() {
  return (
    <Assistant>
      <Label label="Inkscape is installed. This assistant will set it up." />
    </Assistant>
  )
}
