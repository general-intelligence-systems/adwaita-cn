// The same clock application as app.rb beside this, from the registry.

import { Box } from "@/ui/box"
import { Button } from "@/ui/button"
import { HeaderBar } from "@/ui/header-bar"
import { Label } from "@/ui/label"
import { Paned } from "@/ui/paned"
import { Revealer } from "@/ui/revealer"
import { Spinner } from "@/ui/spinner"
import { Squeezer } from "@/ui/squeezer"
import { Stack } from "@/ui/stack"
import { StackSidebar } from "@/ui/stack-sidebar"
import { StackSwitcher } from "@/ui/stack-switcher"
import { ToolbarView } from "@/ui/toolbar-view"
import { Window } from "@/ui/window"

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
          startChild={<StackSidebar />}
          endChild={
            <Stack>
              <Box orientation="vertical" spacing={6} className="gap-1.5 m-3">
                {CITIES.map(([city, time]) => (
                  <Box key={city} orientation="horizontal" spacing={12} className="gap-3">
                    <Label label={city} className="text-left grow" />
                    <Label label={time} />
                  </Box>
                ))}
              </Box>
              <Box orientation="vertical" spacing={12} className="gap-3 m-3">
                <Squeezer>
                  <Label label="00:00:12.48 elapsed" className="text-3xl" />
                </Squeezer>
                <Spinner className="self-center" />
                <Revealer revealChild>
                  <Label label="Lap 3 — 4.12" className="opacity-55" />
                </Revealer>
              </Box>
            </Stack>
          }
        />
      }
    >
      <HeaderBar titleWidget={<StackSwitcher />}>
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
            <Label label="00:05:00" className="text-4xl" />
            <Button size="pill" variant="suggestedAction" label="Start" halign="center" />
          </Box>
        }
      >
        <HeaderBar />
      </ToolbarView>
    </Window>
  )
}
