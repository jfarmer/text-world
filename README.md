# TEXT WORLD

## Contents <!-- omit in toc -->

- [Installing](#installing)
- [Editing The Map](#editing-the-map)
- [How It Works](#how-it-works)
  - [Ray Casting](#ray-casting)
  - [Fake 3D](#fake-3d)
  - [Screen Coordinates](#screen-coordinates)

## Installing

1. Fork + clone this repository
1. Run `npm install` to install the required packages

To run the virtual world, run:

```console
node world.js map.txt
```

Use `w`, `a`, `s`, and `d` to move around. Press `Ctrl+C` to quit.

## Editing The Map

Edit `map.txt` to change the virtual world. It has to be `32x32` characters.

- `#` represents a wall
- `.` represents an open spot

## How It Works

### Ray Casting

The general technique is called [ray casting][wiki-ray-casting]. This is the same technique used in early 3D games like [Wolfenstein 3D][youtube-wolfenstein-3d].

The idea is to imagine a camera pointing out over some 3D scene. We "cast" rays of light out from the camera. How wide a sweep we make depends on the field of view, which we can configure. With a 90º (π/2 radian) field of view, you'd cast out angles from 45º to the left of the direction of the camera, up to 45º to the right of the direction of the camera.

Every "ray" corresponds to a column of text.

We slowly increment the length of the ray until it hits a (virtual) wall or we reach some cutoff point (called the "render distance").

The height of the object on screen is inversely proportional to its distance from us, i.e., a wall 20 units away from us will appear twice as small as a wall 10 units away from us.

### Fake 3D

The virtual world isn't *really* 3D. Every wall has the same height. When a ray hits a wall, we determine how many rows in that column should look like sky, how many should look like wall, and how many should look like floor.

The camera can't look up and down.

### Screen Coordinates

We imagine an `(x,y)` plane having `(0,0)` in the bottom-left corner, with the positive `x`-axis pointing right and the positive `y`-axis pointing up.

On most computer screens, `(0,0)` is the top-left corner. Moving to the right increases the value of the `x` coordinate, like normal, but moving **down** increases the value of the `y` coordinate.

On a screen that's `400` pixels/characters wide and `300` pixels/characters tall, these are the coordinates of the four corners?

- `(0,0)` is the top left corner
- `(0, 300)` is the top right corner
- `(400, 0)` is the bottom left corner
- `(400, 300)` is the bottom right corner

[wiki-ray-casting]: https://en.wikipedia.org/wiki/Ray_casting
[youtube-wolfenstein-3d]: https://www.youtube.com/watch?v=561sPCk6ByE
