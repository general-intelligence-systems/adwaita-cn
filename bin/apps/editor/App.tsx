// The same text editor as app.rb beside this, from the registry.

import { AboutWindow } from "@/ui/about-window"
import { ActionBar } from "@/ui/action-bar"
import { Box } from "@/ui/box"
import { Button } from "@/ui/button"
import { FileChooserDialog } from "@/ui/file-chooser-dialog"
import { FontChooserDialog } from "@/ui/font-chooser-dialog"
import { HeaderBar } from "@/ui/header-bar"
import { MenuButton } from "@/ui/menu-button"
import { PageSetupUnixDialog } from "@/ui/page-setup-unix-dialog"
import { PrintUnixDialog } from "@/ui/print-unix-dialog"
import { Scrollbar } from "@/ui/scrollbar"
import { ScrolledWindow } from "@/ui/scrolled-window"
import { SearchBar } from "@/ui/search-bar"
import { SearchEntry } from "@/ui/search-entry"
import { ShortcutsDialog } from "@/ui/shortcuts-dialog"
import { SplitButton } from "@/ui/split-button"
import { Statusbar } from "@/ui/statusbar"
import { TabBar } from "@/ui/tab-bar"
import { TabButton } from "@/ui/tab-button"
import { TabOverview } from "@/ui/tab-overview"
import { TabView } from "@/ui/tab-view"
import { Text } from "@/ui/text"
import { TextView } from "@/ui/text-view"
import { ToolbarView } from "@/ui/toolbar-view"
import { Viewport } from "@/ui/viewport"

const TEXT = `# Notes

The editor is a tab view of documents, a find bar over the text and a
status bar under it.

Everything here is drawn by the components beside it.
`

export default function EditorApp() {
  return (
    <TabOverview
      child={
        <ToolbarView
          content={
            <ScrolledWindow>
              <Viewport>
                <TextView monospace leftMargin={12} rightMargin={12} topMargin={12} buffer={TEXT} />
              </Viewport>
              <Scrollbar orientation="vertical" />
            </ScrolledWindow>
          }
        >
          <HeaderBar>
            <TabButton />
            <SplitButton variant="suggestedAction" label="Save" />
            <MenuButton variant="flat" iconName="open-menu-symbolic" />
          </HeaderBar>
          <TabBar>
            {["notes.md", "README", "LICENCE"].map((name) => (
              <TabButton key={name}>{name}</TabButton>
            ))}
          </TabBar>
          <SearchBar searchModeEnabled>
            <SearchEntry placeholderText="Find in document" />
          </SearchBar>
          <TabView>
            <Box orientation="vertical">
              <Button label="notes.md" />
            </Box>
          </TabView>
          {/* AdwToolbarView reveals bottom bars as well as top ones, and the generated
              component has no slot for them, so the status bar is rendered with the top
              bars rather than under the content. The report says so. */}
          <ActionBar revealed>
            <Statusbar>Ln 1, Col 1</Statusbar>
            <Text text="1" widthChars={4} />
          </ActionBar>
        </ToolbarView>
      }
    />
  )
}

// The tab overview, opened. Its thumbnails are built by the overview itself, so this
// is the only screen they are ever on.
export function Tabs() {
  return (
    <TabOverview
      open
      child={
        <ToolbarView
          content={
            <TabView>
              {/* The overview builds a thumbnail per page into its own grid, and the
                  component renders only its `child`, so they are rendered here. */}
              {["notes.md", "README", "LICENCE"].map((name) => (
                <Box key={name} orientation="vertical" />
              ))}
            </TabView>
          }
        >
          <HeaderBar />
          <TabBar>
            {["notes.md", "README", "LICENCE"].map((name) => (
              <TabButton key={name}>{name}</TabButton>
            ))}
          </TabBar>
        </ToolbarView>
      }
    />
  )
}

// The keyboard shortcuts it advertises.
export function Shortcuts() {
  return <ShortcutsDialog />
}

// The about window, which this application still uses rather than the dialog.
export function About() {
  return (
    <AboutWindow
      applicationName="Text Editor"
      applicationIcon="text-editor-symbolic"
      developerName="The adwaita-cn authors"
      version="1.0.0"
      website="https://example.org"
    />
  )
}

export function Open() {
  return <FileChooserDialog title="Open Document" />
}

export function Print() {
  return <PrintUnixDialog title="Print" />
}

export function PageSetup() {
  return <PageSetupUnixDialog title="Page Setup" />
}

export function Font() {
  return <FontChooserDialog title="Editor Font" />
}
