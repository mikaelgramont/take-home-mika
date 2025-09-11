# Take-home project

I'll be adding notes here as I build this.

## Progress

1. I find it good practice to leverage Typescript early and create business object types ASAP. I used this prompt to create basic types:
   `Suggest Typescript types we should create before we build anything`

2. I wanted to create a service layer that would normally go to the network but now only goes to local storage, and perhaps later will save files to some storage bucket. Defining the interface with the backend helps decouple BE and FE. In our case we don't have an actual BE, but let's act as if we did. Using local storage will make the app easier to work with as it will add persistence across page reloads.

3. Installed Tailwind with by following the [docs](https://tailwindcss.com/docs/installation/using-vite)
