/**
 * Shared branding block for login and signup pages (TerraScore).
 * Responsive size for mobile. Renders logo + optional page title.
 */
export function AuthBranding() {
  return (
    <div className="flex flex-col items-center text-center">
      <img
        src="/logo.png"
        alt="TerraScore"
        className="w-auto max-w-[180px] object-contain sm:h-14 sm:max-w-[200px]"
      />
    </div>
  )
}
