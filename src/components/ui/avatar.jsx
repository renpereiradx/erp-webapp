"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

const avatarSizeClasses = {
  16: "avatar--16",
  20: "avatar--20",
  24: "avatar--24",
  32: "avatar--32",
  48: "avatar--48",
  56: "avatar--56",
  72: "avatar--72",
  96: "avatar--96",
}

const avatarColorClasses = {
  neutral: "avatar--neutral",
  brand: "avatar--brand",
  "colorful-1": "avatar--colorful-1",
  "colorful-2": "avatar--colorful-2",
  "colorful-3": "avatar--colorful-3",
  "colorful-4": "avatar--colorful-4",
  "colorful-5": "avatar--colorful-5",
  "colorful-6": "avatar--colorful-6",
}

function Avatar({
  className,
  size = 32,
  color,
  ...props
}) {
  const sizeClass = avatarSizeClasses[size] || "avatar--32"
  const colorClass = color ? avatarColorClasses[color] : ""

  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn("avatar", sizeClass, colorClass, className)}
      {...props} />
  );
}

function AvatarImage({
  className,
  ...props
}) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("avatar__image", className)}
      {...props} />
  );
}

function AvatarFallback({
  className,
  ...props
}) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "avatar__initials flex size-full items-center justify-center bg-muted",
        className
      )}
      {...props} />
  );
}

export { Avatar, AvatarImage, AvatarFallback }