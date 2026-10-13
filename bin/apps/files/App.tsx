// The same file manager as app.rb beside this, from the registry.

import { ActionRow } from "@/ui/action-row"
import { AlertDialog } from "@/ui/alert-dialog"
import { AppChooserDialog } from "@/ui/app-chooser-dialog"
import { Box } from "@/ui/box"
import { Button } from "@/ui/button"
import { ColumnView } from "@/ui/column-view"
import { Dialog } from "@/ui/dialog"
import { GridView } from "@/ui/grid-view"
import { HeaderBar } from "@/ui/header-bar"
import { Label } from "@/ui/label"
import { OverlaySplitView } from "@/ui/overlay-split-view"
import { Popover } from "@/ui/popover"
import { PreferencesGroup } from "@/ui/preferences-group"
import { ScrolledWindow } from "@/ui/scrolled-window"
import { SearchEntry } from "@/ui/search-entry"
import { Sidebar } from "@/ui/sidebar"
import { Stack } from "@/ui/stack"
import { StackSwitcher } from "@/ui/stack-switcher"
import { ToolbarView } from "@/ui/toolbar-view"
import { TreeExpander } from "@/ui/tree-expander"
import { WindowTitle } from "@/ui/window-title"

const ENTRIES = ["Reports", "Invoices", "notes.md", "photo.jpg", "archive.zip"]

export default function FilesApp() {
  return (
    <OverlaySplitView
      showSidebar
      minSidebarWidth={200}
      maxSidebarWidth={240}
      sidebar={<Sidebar className="w-[200px]" />}
      content={
        <ToolbarView
          content={
            <Stack>
              <ScrolledWindow>
                <GridView minColumns={2} maxColumns={4}>
                  {ENTRIES.map((entry) => (
                    <Label key={entry} label={entry} className="text-left" />
                  ))}
                </GridView>
              </ScrolledWindow>
              <ScrolledWindow>
                <ColumnView>
                  {ENTRIES.map((entry) => (
                    <TreeExpander key={entry}>
                      <Label label={entry} className="text-left" />
                    </TreeExpander>
                  ))}
                </ColumnView>
              </ScrolledWindow>
            </Stack>
          }
        >
          <HeaderBar titleWidget={<WindowTitle title="Documents" subtitle="5 items" />}>
            <Button variant="flat" iconName="go-previous-symbolic" />
            <StackSwitcher />
            <SearchEntry placeholderText="Search" />
          </HeaderBar>
        </ToolbarView>
      }
    />
  )
}

// The menu a right click opens over a file.
export function Menu() {
  return (
    <Popover>
      <Box orientation="vertical">
        {["Open", "Rename", "Delete"].map((label) => (
          <Button key={label} variant="flat" label={label} />
        ))}
      </Box>
    </Popover>
  )
}

// What it asks before deleting.
export function Delete() {
  return (
    <AlertDialog heading="Delete “photo.jpg”?" body="It will be moved to the wastebasket.">
      <Button label="Cancel" />
      <Button variant="destructiveAction" label="Delete" />
    </AlertDialog>
  )
}

// The properties sheet.
export function Properties() {
  return (
    <Dialog title="Properties" contentWidth={360} contentHeight={260}>
      <ToolbarView
        content={
          <PreferencesGroup>
            <ActionRow title="Name" subtitle="photo.jpg" />
            <ActionRow title="Size" subtitle="2.4 MB" />
            <ActionRow title="Modified" subtitle="Today 09:14" />
          </PreferencesGroup>
        }
      >
        <HeaderBar />
      </ToolbarView>
    </Dialog>
  )
}

export function OpenWith() {
  return <AppChooserDialog />
}
