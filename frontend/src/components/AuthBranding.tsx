/**
 * Shared branding block for login and signup pages (TerraScore).
 * Responsive size for mobile. Renders logo + optional page title.
 */
interface AuthBrandingProps {
  src?: string
}

export function AuthBranding({ src = "/logo.png" }: AuthBrandingProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <img
        src={src}
        alt="TerraScore"
        className="w-auto max-w-[250px] mx-auto object-contain sm:h-20 sm:max-w-[250px]"
      />
    </div>
  )
}
