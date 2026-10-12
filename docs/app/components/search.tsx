"use client"

import { useStaticSearch } from "fumadocs-core/search/client"
import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogOverlay,
  type SharedProps,
} from "fumadocs-ui/components/dialog/search"

// The static client downloads the index /api/search wrote at build time and
// searches it in the browser, because there is no server here to ask. It finds
// the index under the base path on its own: the default is join(BASE_URL,
// "/api/search"), and BASE_URL is what vite.config.ts set as `base`.
export default function DocsSearchDialog(props: SharedProps) {
  const search = useStaticSearch()

  return (
    <SearchDialog {...search} {...props}>
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput />
          <SearchDialogClose />
        </SearchDialogHeader>
        <SearchDialogList />
      </SearchDialogContent>
    </SearchDialog>
  )
}
