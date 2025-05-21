"use client"

import { useEffect, useRef } from "react"

export default function PixelAvatar({ size = 200 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const pixelSize = size / 16

    ctx.clearRect(0, 0, size, size)

    const colors = [
      "#FF5555", // красный
      "#55FF55", // зеленый
      "#5555FF", // синий
      "#FFFF55", // желтый
      "#FF55FF", // розовый
      "#55FFFF", // голубой
      "#FFFFFF", // белый
    ]

    // Создаем симметричный узор для аватара
    const grid = Array(8)
      .fill(0)
      .map(() => Array(8).fill(0))

    // Заполняем левую половину случайными цветами
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 4; x++) {
        // Случайный цвет из палитры
        const colorIndex = Math.floor(Math.random() * colors.length)
        grid[y][x] = colorIndex

        // Зеркально отражаем для правой половины
        grid[y][7 - x] = colorIndex
      }
    }

    // Рисуем пиксели
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        // Определяем, относится ли пиксель к аватару или фону
        if (y >= 4 && y < 12 && x >= 4 && x < 12) {
          // Пиксель аватара
          const gridX = Math.floor((x - 4) / 2)
          const gridY = Math.floor((y - 4) / 2)
          ctx.fillStyle = colors[grid[gridY][gridX]]
        } else {
          // Фон (прозрачный)
          continue
        }

        ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize)
      }
    }

    // Добавляем эффект CRT (легкие линии)
    ctx.globalAlpha = 0.1
    ctx.fillStyle = "#000000"

    for (let y = 0; y < size; y += 2) {
      ctx.fillRect(0, y, size, 1)
    }

    ctx.globalAlpha = 1.0
  }, [size])

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="rounded-full border-4 border-primary/50 shadow-lg shadow-primary/20"
    />
  )
}
