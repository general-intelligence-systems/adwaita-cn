// The same photo library as app.rb beside this, from the registry.

import { AspectFrame } from "@/ui/aspect-frame"
import { BottomSheet } from "@/ui/bottom-sheet"
import { Box } from "@/ui/box"
import { Button } from "@/ui/button"
import { DrawingArea } from "@/ui/drawing-area"
import { FlowBox } from "@/ui/flow-box"
import { FlowBoxChild } from "@/ui/flow-box-child"
import { GLArea } from "@/ui/glarea"
import { GraphicsOffload } from "@/ui/graphics-offload"
import { HeaderBar } from "@/ui/header-bar"
import { Image } from "@/ui/image"
import { Label } from "@/ui/label"
import { Overlay } from "@/ui/overlay"
import { Picture } from "@/ui/picture"
import { ScrolledWindow } from "@/ui/scrolled-window"
import { ToolbarView } from "@/ui/toolbar-view"
import { WrapBox } from "@/ui/wrap-box"

const TAGS = ["Holiday", "Family", "Landscape", "Portrait", "Archive"]

export default function PhotosApp() {
  return (
    <ToolbarView
      content={
        <Box orientation="vertical" spacing={12} className="gap-3 m-3">
          <ScrolledWindow className="h-[180px]">
            <FlowBox minChildrenPerLine={3} maxChildrenPerLine={5} rowSpacing={6} columnSpacing={6} selectionMode="none">
              {Array.from({ length: 8 }, (_, index) => (
                <FlowBoxChild key={index}>
                  <Image iconName="image-x-generic-symbolic" pixelSize={48} />
                </FlowBoxChild>
              ))}
            </FlowBox>
          </ScrolledWindow>
          <Overlay>
            <AspectFrame ratio={1.5} obeyChild={false}>
              <GraphicsOffload>
                <Picture alternativeText="The selected photo" className="h-[120px]" />
              </GraphicsOffload>
            </AspectFrame>
            <Label label="1 selected" className="self-start justify-self-end" />
          </Overlay>
          <DrawingArea contentWidth={120} contentHeight={48} />
          <GLArea className="h-12" />
          <WrapBox childSpacing={6} lineSpacing={6}>
            {TAGS.map((tag) => (
              <Label key={tag} label={tag} className="dim-label" />
            ))}
          </WrapBox>
        </Box>
      }
    >
      <HeaderBar>
        <Button variant="flat" label="Select" />
      </HeaderBar>
    </ToolbarView>
  )
}

// The sheet which slides up to share a photo.
export function Share() {
  return (
    <BottomSheet
      open
      content={<Label label="The library, behind the sheet" />}
      sheet={
        <Box orientation="vertical" spacing={6} className="gap-1.5 m-[18px]">
          <Label label="Share “photo.jpg”" className="title-4" />
          <Label label="Pick somewhere to send it." className="dim-label" />
        </Box>
      }
    />
  )
}
