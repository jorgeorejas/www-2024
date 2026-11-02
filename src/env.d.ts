/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** Rows of the "Secciones" database in Notion, ordered */
    sections: import("./lib/notion/collections").Section[];
    /** The request carries ?preview=<PREVIEW_SECRET>: drafts are visible */
    preview: boolean;
  }
}
