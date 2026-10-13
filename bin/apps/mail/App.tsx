// The same mail client as app.rb beside this, from the registry.

import { ActionRow } from "@/ui/action-row"
import { Avatar } from "@/ui/avatar"
import { Banner } from "@/ui/banner"
import { Box } from "@/ui/box"
import { Button } from "@/ui/button"
import { Flap } from "@/ui/flap"
import { HeaderBar } from "@/ui/header-bar"
import { IndicatorBin } from "@/ui/indicator-bin"
import { InlineViewSwitcher } from "@/ui/inline-view-switcher"
import { Label } from "@/ui/label"
import { Leaflet } from "@/ui/leaflet"
import { ListBox } from "@/ui/list-box"
import { ListBoxRow } from "@/ui/list-box-row"
import { MessageDialog } from "@/ui/message-dialog"
import { ToggleButton } from "@/ui/toggle-button"
import { ToolbarView } from "@/ui/toolbar-view"
import { ViewStack } from "@/ui/view-stack"
import { ViewSwitcher } from "@/ui/view-switcher"
import type { ViewPage } from "@/lib/view-pages"
import { ViewSwitcherBar } from "@/ui/view-switcher-bar"
import { ViewSwitcherSidebar } from "@/ui/view-switcher-sidebar"
import { ViewSwitcherTitle } from "@/ui/view-switcher-title"

const MESSAGES = [
  ["Ada Lovelace", "The analytical engine", "AL"],
  ["Alan Turing", "On computable numbers", "AT"],
  ["Grace Hopper", "Re: the compiler", "GH"],
]

// `stack.add_titled_with_icon` in app.rb beside this: the stack's pages, which every
// switcher on the screen reads its buttons off.
const PAGES: ViewPage[] = [
  { name: "inbox", title: "Inbox", iconName: "mail-unread-symbolic" },
  { name: "drafts", title: "Drafts", iconName: "document-edit-symbolic" },
  { name: "sent", title: "Sent", iconName: "mail-send-symbolic" },
]

export default function MailApp() {
  return (
    <Box orientation="horizontal">
      <ViewSwitcherSidebar className="w-[200px]" pages={PAGES} />
      <ToolbarView
        className="grow"
        content={
          <Box orientation="vertical">
            <Banner title="You are working offline" buttonLabel="Reconnect" revealed />
            <ViewStack className="grow">
              <ListBox selectionMode="single" className="navigation-sidebar">
                <ListBoxRow>
                  <Label label="3 unread" className="text-left ms-3 my-1.5" />
                </ListBoxRow>
                {MESSAGES.map(([sender, subject, initials]) => (
                  <ActionRow
                    key={sender}
                    title={sender}
                    subtitle={subject}
                    prefix={<Avatar size={32} text={initials} showInitials />}
                  />
                ))}
              </ListBox>
            </ViewStack>
          </Box>
        }
      >
        <HeaderBar titleWidget={<ViewSwitcherTitle title="Mail" />}>
          <ViewSwitcher pages={PAGES} />
          <InlineViewSwitcher pages={PAGES} />
          <Button variant="flat" iconName="mail-message-new-symbolic" />
        </HeaderBar>
        <ViewSwitcherBar reveal pages={PAGES} />
      </ToolbarView>
    </Box>
  )
}

// The mailbox tree, which folds away on a narrow window.
export function Folders() {
  return (
    <Leaflet>
      <Flap
        revealFlap
        flap={
          <Box orientation="vertical" spacing={6} className="gap-1.5 w-[160px] mt-3">
            {["Inbox", "Archive", "Spam"].map((name) => (
              <Label key={name} label={name} className="text-left ms-3" />
            ))}
          </Box>
        }
        content={<Label label="Pick a folder" className="grow" />}
      />
    </Leaflet>
  )
}

// The window it opens to write a message, which is still the old message dialog.
export function Compose() {
  return (
    <MessageDialog heading="Send this message?" body="It will be delivered to three recipients.">
      <Button label="Discard" />
      <Button variant="suggestedAction" label="Send" />
    </MessageDialog>
  )
}
