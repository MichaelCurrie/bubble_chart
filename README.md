# Animated Bubble Charts

Create animated bubble charts using D3.js.

[Demo available here.](https://bl.ocks.org/MichaelCurrie/raw/5e2da378a53ea624082cb55e78fdfa05/#)

![](bubble%20demo.gif?raw=true)

Based directly on Jim Vallandingham's work [in this repo](https://github.com/vlandham/bubble_chart) and described at [his blog](http://vallandingham.me/bubble_charts_in_js.html).

Changes in this fork:
- Reorganized the code
- Generalized the code so that any number of groupings can be specified, with `bubble_parameters.js`
- Upgraded d3.js from v3 to v4
- Changed collision force model so circles don't overlap while moving (inspired by https://bl.ocks.org/mbostock/31ce330646fa8bcb7289ff3b97aab3f5)
- Changed example data, to largest cities of the world (needed data with a geographic component to demonstate the map feature).  Source: https://fusiontables.google.com/DataSource?docid=1MYXX1aUrAW4CVWQwewqU4c6-Pti8Nk0BSklNYHY
- Added scatterplot and map options

## Running

D3 needs to be run from a webserver due to how it imports data files.

See more here: https://github.com/mbostock/d3/wiki#using

So, to run this visualization locally, from the Terminal, navigate to the directory you checked it out to

```
cd ~/code/path/to/bubble_chart
```

Then start a webserver locally. If you have Python installed, you should be able to use Python's built-in webserver:

```
python -m http.server 8888
```

** Node.js http-server

Alternatively, you can try using node's [http-server](https://www.npmjs.com/package/http-server)
for local hosting:

Ensure you have the node package installed:

```
npm install -g http-server
```

And then run it in the root directory of the repository.

```
http-server
```

## Caveats

**Bubbles might not be the answer to your problems**

While the bubbles are flashy and are fun to watch move around, they may not be the best visual form to display your information in. In most cases, when bubbles are used to encode a single variable, the two dimensional bubble inflates and obscures the one dimensional value it is attempting to display.

Kaiser Fung hates bubble charts. You can see lots of reasons why here: http://junkcharts.typepad.com/junk_charts/bubble_chart/

Just keep in mind when you are working with your data: Bubbles aren't always the answer.
