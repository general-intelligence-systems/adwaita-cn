// The same process viewer as app.rb beside this, from the registry.

import { Box } from "@/ui/box"
import { CellView } from "@/ui/cell-view"
import { ComboBox } from "@/ui/combo-box"
import { ComboBoxText } from "@/ui/combo-box-text"
import { Expander } from "@/ui/expander"
import { HeaderBar } from "@/ui/header-bar"
import { IconView } from "@/ui/icon-view"
import { Label } from "@/ui/label"
import { Notebook } from "@/ui/notebook"
import { PopoverMenuBar } from "@/ui/popover-menu-bar"
import { ScrolledWindow } from "@/ui/scrolled-window"
import { Statusbar } from "@/ui/statusbar"
import { ToolbarView } from "@/ui/toolbar-view"
import { TreeView } from "@/ui/tree-view"
import { WindowControls } from "@/ui/window-controls"
import { WindowHandle } from "@/ui/window-handle"

const PROCESSES = ["systemd", "gnome-shell", "tracker-miner", "pipewire", "ruby"]

export default function ConsoleApp() {
  return (
    <ToolbarView
      content={
        <Box orientation="vertical">
          <Notebook className="grow">
            <ScrolledWindow>
              <TreeView>
                {PROCESSES.map((name) => (
                  <Label key={name} label={name} className="text-left" />
                ))}
              </TreeView>
            </ScrolledWindow>
            <ScrolledWindow>
              <IconView columns={4}>
                {PROCESSES.map((name) => (
                  <Label key={name} label={name} />
                ))}
              </IconView>
            </ScrolledWindow>
          </Notebook>
          <Expander label="Selected process" expanded>
            <CellView>
              <Label label="systemd" />
            </CellView>
          </Expander>
          <Statusbar>5 processes, 1.2 GB in use</Statusbar>
        </Box>
      }
    >
      <HeaderBar
        titleWidget={
          <Box orientation="horizontal" spacing={6} className="gap-1.5">
            <ComboBox active={0} />
            <ComboBoxText active={0} />
          </Box>
        }
      />
    </ToolbarView>
  )
}

// The menu bar, which this application shows instead of a header menu when the
// desktop asks for one.
export function Menubar() {
  return (
    <WindowHandle>
      <Box orientation="horizontal">
        <PopoverMenuBar className="grow" />
        <WindowControls side="end" />
      </Box>
    </WindowHandle>
  )
}
