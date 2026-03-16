import * as React from "react"
import * as MenubarPrimitive from "@radix-ui/react-menubar"

import { cn } from "@/lib/utils"

const Menubar = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Root
    ref={ref}
    className={cn(
      "flex h-16 w-full items-center justify-around bg-[#1b5e20] text-white shadow-[0_-2px_4px_rgba(0,0,0,0.15)]",
      className,
    )}
    {...props}
  />
))
Menubar.displayName = MenubarPrimitive.Root.displayName

const MenubarMenu = MenubarPrimitive.Menu

const MenubarTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Trigger> & {
    "data-active"?: boolean
  }
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex flex-1 flex-col items-center justify-center gap-0.5 px-3 py-2 text-xs font-medium outline-none transition-colors",
      "data-[state=open]:bg-[#2e7d32] data-[data-active=true]:bg-[#2e7d32] hover:bg-[#2e7d32]/70",
      className,
    )}
    {...props}
  />
))
MenubarTrigger.displayName = MenubarPrimitive.Trigger.displayName

export { Menubar, MenubarMenu, MenubarTrigger }

