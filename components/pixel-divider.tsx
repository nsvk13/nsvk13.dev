export default function PixelDivider() {
  return (
    <div className="flex justify-center my-8">
      <div className="w-full max-w-md h-4 relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t-2 border-neon-purple"></div>
        </div>
        <div className="relative flex justify-center">
          <div className="w-2 h-2 bg-neon-pink"></div>
          <div className="w-2 h-2 bg-neon-purple"></div>
          <div className="w-2 h-2 bg-neon-cyan"></div>
          <div className="w-2 h-2 bg-neon-purple"></div>
          <div className="w-2 h-2 bg-neon-pink"></div>
        </div>
      </div>
    </div>
  )
}
