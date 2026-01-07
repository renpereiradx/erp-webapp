import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Table component using Fluent Design System 2 SCSS classes.
 * 
 * Uses the data-table SCSS classes for consistent styling with
 * the Fluent Design System.
 */

function Table({ className, ...props }) {
  return (
    <div data-slot="table-container" className="data-table">
      <div className="data-table__wrapper">
        <table
          data-slot="table"
          className={cn("data-table__table", className)}
          {...props}
        />
      </div>
    </div>
  )
}

function TableHeader({ className, ...props }) {
  return (
    <thead
      data-slot="table-header"
      className={cn(className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }) {
  return (
    <tbody
      data-slot="table-body"
      className={cn(className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(className)}
      {...props}
    />
  )
}

function TableRow({ className, ...props }) {
  return (
    <tr
      data-slot="table-row"
      className={cn(className)}
      {...props}
    />
  )
}

function TableHead({ className, ...props }) {
  return (
    <th
      data-slot="table-head"
      className={cn(className)}
      {...props}
    />
  )
}

function TableCell({ className, isId = false, ...props }) {
  return (
    <td
      data-slot="table-cell"
      className={cn(isId && "id-cell", className)}
      {...props}
    />
  )
}

function TableCaption({ className, ...props }) {
  return (
    <caption
      data-slot="table-caption"
      className={cn(className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
