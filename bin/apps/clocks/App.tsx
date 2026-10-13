// The same clock application as app.rb beside this, from the registry.

import { Box } from "@/ui/box"
import { Button } from "@/ui/button"
import { HeaderBar } from "@/ui/header-bar"
import { Label } from "@/ui/label"
import { ListBox } from "@/ui/list-box"
import { ListBoxRow } from "@/ui/list-box-row"
import { Paned } from "@/ui/paned"
import { Revealer } from "@/ui/revealer"
import { Spinner } from "@/ui/spinner"
import { Squeezer } from "@/ui/squeezer"
import { Stack } from "@/ui/stack"
import { StackSidebar } from "@/ui/stack-sidebar"
import { StackSwitcher } from "@/ui/stack-switcher"
import { ToggleButton } from "@/ui/toggle-button"
import { ToolbarView } from "@/ui/toolbar-view"
import { Window } from "@/ui/window"

const PAGES: [string, string][] = [
  ["world", "World"],
  ["alarms", "Alarms"],
  ["stopwatch", "Stopwatch"],
]

const CITIES: [string, string][] = [
  ["London", "09:14"],
  ["Lisbon", "09:14"],
  ["New York", "04:14"],
]

export default function ClocksApp() {
  return (
    <ToolbarView
      content={
        <Paned
          position={180}
          resizeStartChild={false}
          startChild={
            <StackSidebar>
              <ListBox className="navigation-sidebar">
                {PAGES.map(([name, title]) => (
                  <ListBoxRow key={name} name={name} selected={name === "world"}>
                    <Label label={title} className="text-left" />
                  </ListBoxRow>
                ))}
              </ListBox>
            </StackSidebar>
          }
          endChild={
            <Stack>
              <Box name="world" orientation="vertical" spacing={6} className="gap-1.5 m-3">
                {CITIES.map(([city, time]) => (
                  <Box key={city} orientation="horizontal" spacing={12} className="gap-3">
                    <Label label={city} className="text-left grow" />
                    <Label label={time} />
                  </Box>
                ))}
              </Box>
              <Box name="stopwatch" orientation="vertical" spacing={12} className="gap-3 m-3">
                <Squeezer>
                  <Label label="00:00:12.48 elapsed" className="title-1" />
                </Squeezer>
                <Spinner className="self-center" />
                <Revealer revealChild>
                  <Label label="Lap 3 — 4.12" className="dim-label" />
                </Revealer>
              </Box>
            </Stack>
          }
        />
      }
    >
      {/* GtkStackSwitcher builds a button per page out of the stack it is bound to, and a
          binding between two widgets is not something JSX carries, so the pages are named
          here the way `add_titled` names them beside this. */}
      <HeaderBar
        titleWidget={
          <StackSwitcher>
            {PAGES.map(([name, title]) => (
              <ToggleButton key={name} name={name} label={title} active={name === "world"} />
            ))}
          </StackSwitcher>
        }
      >
        <Button variant="flat" iconName="list-add-symbolic" />
      </HeaderBar>
    </ToolbarView>
  )
}

// The timer, which this application puts in a window of its own.
export function Timer() {
  return (
    <Window>
      <ToolbarView
        content={
          <Box orientation="vertical" spacing={12} className="gap-3 m-[18px] self-center">
            <Label label="00:05:00" className="title-1" />
            <Button size="pill" variant="suggestedAction" label="Start" halign="center" />
          </Box>
        }
      >
        <HeaderBar />
      </ToolbarView>
    </Window>
  )
}
