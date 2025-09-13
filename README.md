# Take-home project

I'll be adding notes here as I build this.

## Progress

1. I find it good practice to leverage Typescript early and create business object types ASAP. I used this prompt to create basic types:
   `Suggest Typescript types we should create before we build anything`

2. I wanted to create a service layer that would normally go to the network but now only goes to local storage, and perhaps later will save files to some storage bucket. Defining the interface with the backend helps decouple BE and FE. In our case we don't have an actual BE, but let's act as if we did. Using local storage will make the app easier to work with as it will add persistence across page reloads.

3. Installed Tailwind with by following the [docs](https://tailwindcss.com/docs/installation/using-vite)

4. Installed ShadCDN by following the [docs](https://ui.shadcn.com/docs/installation/vite)

5. Set up the layout through CSS grid.

6. Added Breadcrumbs

7. Made the URL the source of truth for current path

8. Rename and delete. The buttons for these still need to be styled a bit better, but we're using ShadCDN Dialogs.

9. Added icons

10. Implemented "New Folder"

11. Implemented "File Upload". I had to change my approach for storing files in `localStorage` as `ArrayBuffers` as that was a little naive. Instead we're now storing the actual files in `IndexedDB` and pointing to them from the data in `localStorage`. Works well.

12. Moved data population script into DataRoomService, and made it generate PDF files on the fly - all for the sake of a good experience on first page load

13. Added restrictions on file uploads (no empty files) and file/folder renaming (max file or folder name length - 255 chars, non-ASCII characters in file or folder names, existing file or folder names in a given folder - case insensitive, max depth of 32 folders).

14. Mobile rendering improvements.
