// The same sidebar application as app.rb beside this, from the registry.

import { ActionRow } from "@/ui/action-row"
import { Avatar } from "@/ui/avatar"
import { Button } from "@/ui/button"
import { HeaderBar } from "@/ui/header-bar"
import { ListBox } from "@/ui/list-box"
import { NavigationPage } from "@/ui/navigation-page"
import { NavigationSplitView } from "@/ui/navigation-split-view"
import { SearchEntry } from "@/ui/search-entry"
import { StatusPage } from "@/ui/status-page"
import { ToolbarView } from "@/ui/toolbar-view"
import { WindowTitle } from "@/ui/window-title"

const PEOPLE = [
  ["Ada Lovelace", "Mathematician", "AL"],
  ["Alan Turing", "Computer scientist", "AT"],
  ["Grace Hopper", "Rear admiral", "GH"],
  ["Katherine Johnson", "Physicist", "KJ"],
] as const

export default function LibraryApp() {
  return (
    <NavigationSplitView
      minSidebarWidth={260}
      sidebar={
        <NavigationPage title="Library">
          <ToolbarView content={<ListBox className="navigation-sidebar">{PEOPLE.map(([title, subtitle, initials]) => (
            <ActionRow
              key={title}
              title={title}
              subtitle={subtitle}
              prefix={<Avatar size={32} text={initials} showInitials />}
            />
          ))}</ListBox>}>
            <HeaderBar titleWidget={<SearchEntry placeholderText="Search" className="grow" />}>
              <Button variant="flat" iconName="list-add-symbolic" />
            </HeaderBar>
          </ToolbarView>
        </NavigationPage>
      }
      content={
        <NavigationPage title="Details">
          <ToolbarView
            content={
              <StatusPage
                iconName="avatar-default-symbolic"
                title="Ada Lovelace"
                description="Select a different person to see their details."
              >
                <Button size="pill" variant="suggestedAction" label="Open" halign="center" />
              </StatusPage>
            }
          >
            <HeaderBar titleWidget={<WindowTitle title="Ada Lovelace" subtitle="Mathematician" />}>
              <Button variant="flat" iconName="open-menu-symbolic" />
            </HeaderBar>
          </ToolbarView>
        </NavigationPage>
      }
    />
  )
}
