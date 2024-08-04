document.addEventListener("DOMContentLoaded", () => {
  require([
    "esri/Map",
    "esri/views/MapView",
    "esri/Graphic",
    "esri/layers/GraphicsLayer",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/geometry/Point",
    "esri/geometry/Circle",
    "esri/widgets/Home",
    "esri/layers/FeatureLayer",
  ], function (
    Map,
    MapView,
    Graphic,
    GraphicsLayer,
    SimpleMarkerSymbol,
    SimpleFillSymbol,
    Point,
    Circle,
    Home,
    FeatureLayer,
  ) {
    let map = new Map({
      basemap: "streets-navigation-vector",
    });

    let view = new MapView({
      container: "viewDiv",
      map: map,
      center: [-100, 40],
      zoom: 4,
    });

    const spatialRelationship = "intersects";
    let circleSymbol = new SimpleFillSymbol({
      color: [255, 255, 255, 0.6],
      outline: {
        color: "red",
        width: 1,
      },
    });
    const featureLayer = new FeatureLayer({
      url: "https://services.gis.ca.gov/arcgis/rest/services/Boundaries/CA_Counties/FeatureServer/0",
      popupTemplate: {
        title: "CA countries",
        content:
          "OBJECTID: {OBJECTID}<br>Population : {Population}<br>AREA_ID: {AREA_ID}<br>DETAIL_CITY: {DETAIL_CITY}",
      },
    });

    map.add(featureLayer);

    let homeWidget = new Home({
      view: view,
    });
    view.ui.add(homeWidget, "top-left");

    let graphicsLayerPoints = new GraphicsLayer();
    let graphicsLayerCircles = new GraphicsLayer();
    map.addMany([graphicsLayerPoints, graphicsLayerCircles]);

    let pointSymbol = new SimpleMarkerSymbol({
      color: "black",
      size: "12px",
      outline: {
        color: [255, 255, 255],
        width: 1,
      },
    });

    let currentCircle;

    view.on("click", (e) => {
      graphicsLayerCircles.removeAll();
      let graphic;
      if (document.getElementById("drawPoint").classList.contains("active")) {
        graphic = new Graphic({
          geometry: e.mapPoint,
          symbol: pointSymbol,
        });
        graphicsLayerPoints.add(graphic);
      } else if (
        document.getElementById("drawCircle").classList.contains("active")
      ) {
        let radius = document.getElementById("radiusSlider").value * 1000;
        let circle = new Circle({
          center: e.mapPoint,
          radius: parseFloat(radius),
        });
        currentCircle = new Graphic({
          geometry: circle,
          symbol: circleSymbol,
        });
        graphicsLayerCircles.add(currentCircle);
      }
    });

    document.getElementById("drawPoint").addEventListener("click", () => {
      toggleActiveButton("drawPoint");
    });

    document.getElementById("drawCircle").addEventListener("click", () => {
      toggleActiveButton("drawCircle");
    });

    document.getElementById("clearPoints").addEventListener("click", () => {
      graphicsLayerPoints.removeAll();
    });

    document.getElementById("clearCircles").addEventListener("click", () => {
      graphicsLayerCircles.removeAll();
      featureLayer.definitionExpression = "1=1";
    });

    document.getElementById("searchButton").addEventListener("click", async () => {
      if (currentCircle) {
        let radius = parseFloat(document.getElementById("radiusSlider").value);
        let newCircleGeometry = new Circle({
          center: currentCircle.geometry.center,
          radius: radius * 1000,
        });

        let graphic = new Graphic({
          geometry: newCircleGeometry,
          symbol: circleSymbol,
        });
        graphicsLayerCircles.remove(currentCircle);
        graphicsLayerCircles.add(graphic);
        currentCircle = graphic;

        const query = featureLayer.createQuery();
        query.outFields = ["*"];
        query.where = "1=1";
        query.geometry = newCircleGeometry;
        query.spatialRelationship = spatialRelationship;
        let result = await featureLayer.queryFeatures(query);
        let featuresIds = result.features.map(
          (feature) => feature.attributes["OBJECTID"]
        );

        if (featuresIds.length !== 0) {
          featureLayer.definitionExpression =
            "OBJECTID IN (" + featuresIds.join(",") + ")";
        } else {
          featureLayer.definitionExpression = "1=3";
        }
      }
    });

    function toggleActiveButton(buttonId) {
      let buttons = document.querySelectorAll(".controls button");
      buttons.forEach((button) => {
        button.classList.remove("active");
      });
      document.getElementById(buttonId).classList.add("active");
    }
  });
});
