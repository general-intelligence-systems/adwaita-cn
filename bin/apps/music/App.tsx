// The same music player as app.rb beside this, from the registry.

import { AboutDialog } from "@/ui/about-dialog"
import { Box } from "@/ui/box"
import { Button } from "@/ui/button"
import { Carousel } from "@/ui/carousel"
import { CarouselIndicatorDots } from "@/ui/carousel-indicator-dots"
import { CarouselIndicatorLines } from "@/ui/carousel-indicator-lines"
import { HeaderBar } from "@/ui/header-bar"
import { Image } from "@/ui/image"
import { Label } from "@/ui/label"
import { MediaControls } from "@/ui/media-controls"
import { Scale } from "@/ui/scale"
import { ScaleButton } from "@/ui/scale-button"
import { Separator } from "@/ui/separator"
import { ToolbarView } from "@/ui/toolbar-view"
import { Video } from "@/ui/video"
import { VolumeButton } from "@/ui/volume-button"

const ALBUMS = ["Kind of Blue", "Blue Train", "A Love Supreme"]

export default function MusicApp() {
  return (
    <ToolbarView
      content={
        <Box orientation="vertical" spacing={12} className="gap-3 m-3">
          <Carousel className="h-[140px]">
            {ALBUMS.map((title) => (
              <Label key={title} label={title} className="title-2 w-[200px]" />
            ))}
          </Carousel>
          <CarouselIndicatorDots />
          <CarouselIndicatorLines />
          <Separator orientation="horizontal" />
          <Box orientation="horizontal" spacing={12} className="gap-3">
            <Image iconName="audio-x-generic-symbolic" pixelSize={48} />
            <Label label="So What" className="title-4 text-left grow" />
            <Button size="circular" variant="suggestedAction" iconName="media-playback-start-symbolic" />
          </Box>
          <MediaControls />
          <Scale value={38} />
          <Video className="h-20" />
        </Box>
      }
    >
      <HeaderBar>
        <ScaleButton icons={["media-playlist-repeat-symbolic"]} />
        <VolumeButton />
      </HeaderBar>
    </ToolbarView>
  )
}

// The about dialog behind its menu.
export function About() {
  return (
    <AboutDialog
      applicationName="Music"
      applicationIcon="audio-x-generic-symbolic"
      developerName="The adwaita-cn authors"
      version="1.0.0"
      website="https://example.org"
    />
  )
}
