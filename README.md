# CineSpin
[**CineSpin**](https://www.cinespin.co.uk/) is your go to movie picker when you just can’t decide what to watch. You can search for a specific film, check out what’s popular or coming soon, or let the app spin the wheel and surprise you with either a great film, a random choice, or even a so bad it’s good option. You can also create your own custom lists so the picks match your taste. CineSpin makes movie night simple, fun, and stress free.

Cinespin is currently **in development** and is still very much a work in progress, it is not commercial. It uses TMDB to source all of it's data and images, along with a community made imdb API. 

## Goals
The main goals in developing CineSpin is to learn, to gain a better understanding of React and general frontend framework concepts along with gaining a better udnerstanding of developing, architecting and designing a large interactive website. 

CineSpin as a concept provides an exceptional learning experience as it involves balancing snappy and responsive web design with a large amount of API calls, images and videos, this provided a great challenge.

**Learning experiences:**

The large number of API calls to two major APIs, those being TMDB and the community made IMDb API means I need to effectively balance UX so that the website is still response and interactible as soon as possible. I used multiple techniques to ensure this:
- Placeholders are used so that there is always content on the page even when API calls haven't completed, this improves percieved performance while also avoiding frustrating content shift that plagues many websites
- API calls are bottlenecked to avoid server errors, though when making calls to the IMDb API this still needs some work
- For content which needs to make multiple API calls such as IMDb and Metacritic ratings on carousels, this data is fetched in batches as we need to get TMDB data in order to get the IMDb ID, which is then used to call the IMDb API. IMDb and Metacritic ratings then use a loading placeholder while we wait for this data. This allows for the important page content to load in first, so that these ratings are not blocking page renders.
- Later I plan to use Redis caching to further improve page loading times.
- Tanstack query was considered and tested, but turned out to increase load times in many cases. This was very likely due to the additional time spent on the cache lookup for pages which hadn't previously been loaded by the client. Additionally query fires later in the lifecycle, waiting for the component to render before even doing the lookup. Since the benefit of tanstack query really only shows on subsequent viewings of data, this overhead is for now deemed unnecessary to introduce as often users will likely be viewing new pages frequently rather than consistently visiting the exact same pages. 

Since CineSpin includes many high quality images and videos, considerations had to be taken when rendering pages to ensure fast first-paints.
- The main background image used in film pages and the homepage use progressive loading, which means we load lower resolution images first until the higher resolution images are loaded in the background, this ensures that even on slower connections an image will always be present.
- Other film images, such as those in carousels, always use image resolutions which are as small as possible whilst maintaing visual fidelity
- Image sizes are loaded from TMDB based on device screen size, so if the user is on a mobile device we only pull in images at a suitable resolution for mobile devices, this optimisation really shows its benefits on slow mobile data connections.
- Images are lazy loaded so that we can defer loading until they are near the viewport, avoiding unnecessary network requests without adding any JS overhead.
- A hook is used to detect the users data speed (2G/3G/4G/5G), and if they are on 2G or 3G, we avoid loading videos entirely.
- On mobile we avoid loading high resolution "backdrop" images entirely in favour of poster images, which are smaller by default, an optimisation both to save on screen space and large network requests.
- For lists, pages will later use infinite scrolling to avoid loading very large numbers of poster images on a single page immediately.

CineSpin is an aesthetically beautiful website, and a good study in design
- Design inspiration is taken heavily from video streaming websites such as Netflix.
- The films are the focus, and that is reflected on every part of the website, with large movie images and only as much data as is absolutely needed.
- Since CineSpin is designed as a video recommendation and partially a logging tool, main film pages can use large images to present films with only the most important information someone would be looking for when deciding on which film they should watch.
- For areas such as lists where we want to see many more films, we use smaller film posters instead.
- Carousel film tiles on desktop include TMDB, IMDb and metacritic ratings, alongside the film title, backdrop and year of release. This is the minimum amount of useful data we can show a user who could be considering what film they want to watch. A black gradient is used on tiles to ensure text is still legible even against bright backdrop images.
- Carousels provide a way to display films in a way that isn't overwhelming, the overwhelming weight of indecision is the main thing we are trying to aleviate in users when trying to find a film. The carousels also save on verticle space, to avoid large amounts of scrolling and too many tiles being on screen at once, this also works perfectly to avoid too many images being immediately loaded on the page, saving precious loading times. My carousels allow for clear separation of what exactly they are showing, and avoid the need to use the classic card-based design. Carousels also feel very nice to use when paired with proper animations.
- Navigation is simple and unintrusive, it needed to be obvious and visible without taking away from the striking images and film content.
- On the homepage you are immediately greeted with a random film rated 8 or higher, this gives the user a chance to see what is likely to be considered a classic, and they may get exactly what they wanted on a first visit.

Here are some examples of how it looks so far:

## Homepage
![The homepage](https://i.imgur.com/C3iIVAr.jpeg)

## Film page
![Page displayed when a film is clicked or search is done](https://i.imgur.com/0NXZNnA.jpeg)

## Mobile
#### Home
![](https://i.imgur.com/5LlF27N.jpeg)

#### Film page
![](https://i.imgur.com/rM9mfBa.jpeg)

