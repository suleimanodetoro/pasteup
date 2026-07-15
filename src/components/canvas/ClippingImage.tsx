import { useRef } from 'react'
import { Image as KonvaImage } from 'react-konva'
import type Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import { useImage } from '../../hooks/useImage'
import type { Clipping } from '../../types'

interface Props {
  clip: Clipping
  isSelected: boolean
  listening: boolean
  onSelect: () => void
  onChange: (patch: Partial<Clipping>) => void
  onInteractStart: () => void
  onInteractEnd: () => void
}

export function ClippingImage({
  clip,
  isSelected,
  listening,
  onSelect,
  onChange,
  onInteractStart,
  onInteractEnd,
}: Props) {
  const image = useImage(clip.src)
  const ref = useRef<Konva.Image>(null)

  return (
    <KonvaImage
      id={clip.id}
      ref={ref}
      image={image}
      x={clip.x}
      y={clip.y}
      width={clip.width}
      height={clip.height}
      rotation={clip.rotation}
      draggable={listening}
      listening={listening}
      onMouseDown={onSelect}
      onTap={onSelect}
      onDragStart={onInteractStart}
      onDragEnd={(e) => {
        onInteractEnd()
        onChange({ x: e.target.x(), y: e.target.y() })
      }}
      onTransformStart={onInteractStart}
      onTransformEnd={(e: KonvaEventObject<Event>) => {
        const node = e.target as Konva.Image
        const scaleX = node.scaleX()
        const scaleY = node.scaleY()
        node.scaleX(1)
        node.scaleY(1)
        onInteractEnd()
        onChange({
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          width: Math.max(12, node.width() * scaleX),
          height: Math.max(12, node.height() * scaleY),
        })
      }}
      shadowColor="#000000"
      shadowBlur={isSelected ? 14 : 9}
      shadowOffset={{ x: 2, y: 4 }}
      shadowOpacity={0.32}
    />
  )
}
