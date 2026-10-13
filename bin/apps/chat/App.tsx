// The same chat application as app.rb beside this, from the registry.

import { ActionRow } from "@/ui/action-row"
import { Avatar } from "@/ui/avatar"
import { Box } from "@/ui/box"
import { Button } from "@/ui/button"
import { EditableLabel } from "@/ui/editable-label"
import { EmojiChooser } from "@/ui/emoji-chooser"
import { Entry } from "@/ui/entry"
import { HeaderBar } from "@/ui/header-bar"
import { Label } from "@/ui/label"
import { ListBox } from "@/ui/list-box"
import { ListView } from "@/ui/list-view"
import { MenuButton } from "@/ui/menu-button"
import { NavigationPage } from "@/ui/navigation-page"
import { NavigationSplitView } from "@/ui/navigation-split-view"
import { NavigationView } from "@/ui/navigation-view"
import { PopoverMenu } from "@/ui/popover-menu"
import { ScrolledWindow } from "@/ui/scrolled-window"
import { ToolbarView } from "@/ui/toolbar-view"

const PEOPLE = [
  ["Ada Lovelace", "See you at three", "AL"],
  ["Alan Turing", "Sent the paper", "AT"],
  ["Grace Hopper", "Nanoseconds", "GH"],
]

const MESSAGES = [
  "Morning — did the build finish?",
  "It did, about ten minutes ago.",
  "Good. I will cut the release after lunch.",
]

export default function ChatApp() {
  return (
    <NavigationSplitView
      minSidebarWidth={240}
      sidebar={
        <NavigationPage title="Chats">
          <ToolbarView
            content={
              <ListBox selectionMode="single" className="navigation-sidebar">
                {PEOPLE.map(([name, preview]) => (
                  <ActionRow
                    key={name}
                    title={name}
                    subtitle={preview}
                    prefix={<Avatar size={32} text={name} showInitials />}
                  />
                ))}
              </ListBox>
            }
          >
            <HeaderBar titleWidget={<EditableLabel text="Nathan" />} />
          </ToolbarView>
        </NavigationPage>
      }
      content={
        <NavigationPage title="Thread">
          <ToolbarView
            content={
              <NavigationView>
                <NavigationPage title="Ada Lovelace">
                  <Box orientation="vertical">
                    <ScrolledWindow className="grow">
                      <ListView>
                        {MESSAGES.map((message) => (
                          <Label key={message} label={message} className="text-left mx-3 my-1.5" />
                        ))}
                      </ListView>
                    </ScrolledWindow>
                    <Box orientation="horizontal" spacing={6} className="gap-1.5 m-1.5">
                      <Entry placeholderText="Message" className="grow" />
                      <MenuButton variant="flat" iconName="face-smile-symbolic" />
                      <Button variant="suggestedAction" iconName="document-send-symbolic" />
                    </Box>
                  </Box>
                </NavigationPage>
              </NavigationView>
            }
          >
            <HeaderBar titleWidget={<Label label="Ada Lovelace" className="font-bold" />}>
              <MenuButton variant="flat" iconName="view-more-symbolic" />
            </HeaderBar>
          </ToolbarView>
        </NavigationPage>
      }
    />
  )
}

// The emoji chooser the composer opens.
export function Emoji() {
  return <EmojiChooser />
}

// The conversation menu.
export function Menu() {
  return <PopoverMenu />
}
