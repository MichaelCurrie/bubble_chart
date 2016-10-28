var BUBBLE_PARAMETERS = {
  "data_file": "largest_cities.csv",
  "report_title": "Largest Cities of the World",
  "footer_text": "A demonstration of animated bubble charts in JavaScript and D3.js",
  "width": 940,
  "height": 800,
  "radius_field": "Population",
  "fill_color": {
    "data_field": "Density Level",
    "colour_groups": {
      "low": "#d84b2a",
      "medium": "#beccae",
      "high": "#7aa25c"
    }
  },
  "tooltip": [
    {"title": "City", "data_field": "City"},
    {"title": "Country", "data_field": "Country"},
    {"title": "Part of the World", "data_field": "Region", "add_commas": 0},
    {"title": "Population", "data_field": "Population", "add_commas": 1},
    {"title": "Area (km^2)", "data_field": "Area", "add_commas": 1},
    {"title": "Density (pop / km^2)", "data_field": "Density", "add_commas": 0}
  ],
  "modes": [
    {
      "button_text": "All Cities",
      "button_id": "all",
      "labels": null,
      "grid_dimensions": {"rows": 1, "columns": 1},
      "data_field": null
    },
    {
      "button_text": "Cities by Region",
      "button_id": "region",
      "labels": ["Asia (Ex. Near East)", "Sub-Saharan Africa", "Latin Amer. & Carib", "Northern Africa", "Near East", "Former Soviet States","Western Europe", "Eastern Europe", "North America", "Oceania"],
      "grid_dimensions": {"rows": 5, "columns": 2},
      "data_field": "Region"
    },
    {
      "button_text": "Cities by Density Level",
      "button_id": "density_level",
      "labels": ["low", "medium", "high"],
      "grid_dimensions": {"rows": 1, "columns": 3},
      "data_field": "Density Level"
    }
  ]
};