# **Engineering High-Performance Interactive Timelines: A Framework-Agnostic Architectural Analysis**

## **Executive Summary**

The construction of interactive timeline applications representing extensive temporal scales—ranging from microseconds to cosmological epochs—presents a unique convergence of challenges in software engineering, computer graphics, and user interface design. While modern JavaScript frameworks such as React, Vue, or Angular offer convenient abstractions for state management and DOM synchronization, they frequently introduce performance overheads that are antithetical to the high-frequency rendering requirements of data-dense visualizations. Consequently, the user query regarding the feasibility of a "vanilla" JavaScript implementation is not merely a stylistic preference but often a performance necessity. By bypassing the reconciliation algorithms of virtual DOMs and the heavy event delegation systems of monolithic frameworks, a developer gains the precise control over the execution stack required to render tens of thousands of entities at 60 frames per second.

This report provides an exhaustive technical analysis of the architectural requirements for building such a system without third-party frameworks. It systematically deconstructs the rendering pipeline, advocating for a hybrid Canvas-DOM approach over pure SVG implementations based on performance benchmarks regarding object count and memory consumption. It further explores the mathematical imperatives of "Deep Time," demonstrating why standard IEEE 754 floating-point numbers and the native JavaScript Date object are mathematically insufficient for historical datasets, necessitating the implementation of custom BigInt-based coordinate systems. The report also critically evaluates the necessity of server-side infrastructure, ultimately arguing that the maturation of client-side storage technologies—specifically IndexedDB and Service Workers—combined with static data delivery models, renders traditional backends obsolete for a significant class of visualization applications.

## **1\. The Rendering Substrate: Comparative Analysis of Graphics Technologies**

The foundational architectural decision in ensuring the viability of a timeline application lies in the selection of the rendering engine. In the context of vanilla JavaScript, the developer is presented with three primary distinct interaction modes: the Document Object Model (DOM), Scalable Vector Graphics (SVG), and the HTML5 Canvas API. Each possesses distinct performance characteristics, memory footprints, and interaction capabilities that dictate their suitability for timeline visualization.

### **1.1 The Limitations of Retained Mode Graphics (DOM and SVG)**

Both the DOM and SVG operate in "retained mode," wherein the browser maintains an internal memory representation—a scene graph—of every geometric element rendered on the screen. For a developer, this offers high-level convenience: one can attach event listeners directly to a rectangle representing a historical event, and the browser handles the hit-testing logic, style recalculation, and rendering updates. However, this convenience comes at a steep computational cost.

Research into browser performance indicates a distinct threshold where retained mode graphics begin to degrade the user experience. When a scene contains fewer than 1,000 to 3,000 objects, SVG offers superior text rendering and accessibility features out of the box.1 However, timeline datasets frequently exceed this magnitude, often reaching into the tens of thousands of data points. In such scenarios, the memory overhead of maintaining the DOM tree becomes the primary bottleneck. Every time a new event is added or a style is changed, the browser must traverse the scene graph, calculate layout reflows, and issue repaint commands.2

For a timeline application requiring smooth panning and zooming—actions that fundamentally alter the transformation matrix of the entire scene every 16 milliseconds (the budget for 60 FPS)—the processing overhead of SVG becomes prohibitive. DOM manipulation is inherently synchronous and heavy; forcing the browser to recalculate the positions of 10,000 \<div\> or \<rect\> elements during a scroll event will inevitably lead to "jank" or frame drops, breaking the illusion of interactivity.4 Furthermore, as noted in performance comparisons, while SVG is resolution-independent, its performance lags significantly with high object counts because each node requires a dedicated Javascript object wrapper and DOM interface.1

### **1.2 The Efficiency of Immediate Mode (Canvas)**

In contrast, the HTML5 Canvas API operates in "immediate mode." It provides a raster bitmap surface upon which the developer issues drawing commands. Once a command is executed—for example, ctx.fillRect(10, 10, 100, 20)—the browser draws the pixels and immediately discards the geometric information. There is no internal object memory, no scene graph, and no event listeners attached to individual shapes.

This architecture shifts the burden of state management from the browser to the application developer but unlocks immense performance potential. Rendering 10,000 or even 100,000 simple shapes on a Canvas is trivial for modern GPUs, as it essentially involves updating a texture buffer.2 The Canvas API allows for batching drawing operations, minimizing the communication overhead between the CPU and the GPU. For an infinite timeline, this means that the application can re-render the entire visible viewport 60 times per second without the memory thrashing associated with DOM nodes.6

However, the "Immediate Mode" nature of Canvas introduces significant engineering challenges that must be "handled" in a vanilla JS implementation. Since the browser does not know that a set of pixels represents a "Battle of Hastings" event, the developer must manually implement:

1. **Hit Detection:** Mathematically determining if a mouse click coordinates intersect with the coordinates of a drawn shape.7  
2. **State Management:** Maintaining a JavaScript array of objects that mimics a scene graph.  
3. **Redraw Logic:** Explicitly clearing and redrawing the canvas whenever the state changes.  
4. **Accessibility:** Since Canvas is just an image to screen readers, a shadow DOM or parallel accessible tree must be constructed.8

### **1.3 The Hybrid "Sandwich" Architecture**

Given the strengths and weaknesses of each technology, the most robust architecture for a professional-grade timeline is not a binary choice but a hybrid composition, often referred to as the "Sandwich Pattern."

| Layer | Technology | Responsibility | Rationale |
| :---- | :---- | :---- | :---- |
| **Foreground** | DOM / HTML | Tooltips, Dialogs, Search UI | High accessibility, native text selection, ease of styling with CSS. |
| **Interaction** | Transparent Canvas | Mouse/Touch Event Capture | Decouples rendering from input; allows unifying input handling for the stack. |
| **Active Scene** | HTML5 Canvas | Event markers, spans, connections | High-performance rendering of thousands of dynamic objects. |
| **Background** | Offscreen Canvas | Grid lines, Static Axis | "Blitting" a static image is faster than recalculating grid geometry every frame. |

This layered approach leverages the DOM for what it does best—displaying high-quality, accessible text and UI controls—while offloading the heavy visualization duties to the Canvas. For instance, while the timeline bars are drawn on the Canvas, hovering over a bar might trigger a standard HTML div tooltip. This avoids the complexity of implementing text wrapping and accessible reading inside the Canvas while maintaining high frame rates.2

### **1.4 High-DPI Display Considerations**

A critical implementation detail often overlooked in vanilla JS Canvas projects is the handling of High-DPI (Retina) displays. Canvas elements map 1:1 to CSS pixels by default. On a screen with a Device Pixel Ratio (DPR) of 2.0, a canvas defined as \<canvas width="500"\> will look blurry because the browser stretches the 500 internal pixels to fill the 1000 physical screen pixels.

To achieve crisp rendering, the application must detect the window.devicePixelRatio and manually scale the canvas buffer. The internal resolution (width attribute) must be multiplied by the DPR, while the display size (style.width) remains at the logical pixel size. The rendering context must then be scaled using ctx.scale(dpr, dpr) to ensure that drawing commands operate in logical coordinates while the rasterizer utilizes the full physical resolution.9 Failure to handle this results in a visual degradation that immediately distinguishes amateur implementations from professional software.

## **2\. Temporal Mathematics and Coordinate Systems**

The second major "thing to be handled" in a framework-less timeline is the mathematical model of time itself. While standard web applications operate within the comfortable bounds of recent history, a timeline tool must often accommodate "Deep Time"—geological or astronomical scales spanning billions of years. This requirement reveals fundamental limitations in the JavaScript language and the IEEE 754 floating-point standard.

### **2.1 The Inadequacy of the Native Date Object**

The native JavaScript Date object is implemented as a signed 64-bit integer representing the number of milliseconds elapsed since the Unix Epoch (00:00:00 UTC on 1 January 1970). While this provides millisecond precision, the effective range is limited to approximately ±100,000,000 days relative to the epoch.10 This translates to a valid date range from roughly April 20, 271,821 BC to September 13, 275,760 AD.11

While sufficient for human resources applications or business intelligence, this range is woefully inadequate for history, geology, or astronomy. A timeline of the Earth (4.5 billion years old) or the Universe (13.8 billion years old) cannot be represented using Date. Attempting to instantiate a date for the dinosaur extinction (65 million years ago) will fail or produce erratic behavior if precise timestamps are required beyond the supported integer limit. Furthermore, the Date object creates complications with historical calendar shifts (Julian vs. Gregorian) and the absence of a "Year Zero" in historical dating, which the native API does not handle intuitively.12

### **2.2 Implementing BigInt Temporal Coordinates**

To support Deep Time, the vanilla JS implementation must abandon Date in favor of a custom scalar coordinate system backed by the BigInt primitive. BigInt was introduced to JavaScript to allow the representation of integers strictly larger than $2^{53} \- 1$, the maximum safe integer in standard JavaScript numbers.14

The application should define a "Zero Point" (e.g., the present moment, or the Big Bang) and represent all time as a BigInt offset from this point. For example, if the base unit is one second, the age of the universe is approximately $4.35 \\times 10^{17}$ seconds, a value easily handled by BigInt but potentially problematic for standard Number precision if millisecond accuracy is retained.

This shift necessitates the creation of a "Time Service" or "Calendar Utility" class. This utility is responsible for:

1. **Parsing:** Converting varied input formats (ISO strings, "2000 BC", "1.5 BYA") into the standardized BigInt coordinate.  
2. **Formatting:** converting the BigInt back into human-readable strings, handling the logic for "BC/AD" suffixes, and astronomical abbreviations (Ma, Ga) which Intl.DateTimeFormat does not natively support for prehistoric scales.12  
3. **Calendar Logic:** Handling the non-existence of year 0 and potentially converting between Julian and Gregorian dates for historical accuracy, a complexity that standard libraries often abstract away but which must be manually coded here.13

### **2.3 Floating Point Precision and the "Jitter" Problem**

A subtle but catastrophic issue arises when mapping these massive temporal coordinates to the screen. The HTML5 Canvas API utilizes floating-point numbers (specifically 32-bit or 64-bit floats depending on the browser implementation) for its coordinate system. IEEE 754 floating-point numbers have variable precision; as the magnitude of the number increases, the gap between representable numbers increases.18

If the application attempts to map a time coordinate of $4,000,000,000$ (representing 4 billion years) directly to a pixel coordinate, the precision loss may result in "jitter." As the user pans the timeline, the floating-point rounding errors will cause events to snap to the nearest representable float value rather than moving smoothly pixel-by-pixel.19

To mitigate this, the rendering pipeline must implement a **Floating Origin** or **Local Coordinate** system. The transformation from "World Time" to "Screen Pixel" must happen in the CPU using high-precision arithmetic (BigInt or high-precision libraries) *before* the value is passed to the Canvas.

The transformation logic flows as follows:

1. **Determine Viewport Window:** Identify the BigInt start time of the currently visible viewport.  
2. **Calculate Relative Offset:** For every event to be drawn, calculate delta \= EventTime \- ViewportStartTime. This subtracts the massive "World Coordinate" to produce a smaller "Relative Coordinate."  
3. **Scale to Pixels:** Multiply the delta by the current zoom factor (pixels per time unit) to get the screen position.  
4. **Draw:** Pass this screen position (which is now a small, manageable number usually between \-1000 and \+4000) to the Canvas API.

By ensuring that the Canvas API only ever receives coordinates relative to the current viewport, the application maintains sub-pixel rendering precision regardless of whether the user is viewing the current year or the formation of the solar system.19

### **2.4 Infinite Zooming Mechanics**

Implementing "Infinite Zoom"—the ability to smoothly transition from viewing billions of years to a single day—requires a robust implementation of affine transformations. The user expectation, established by tools like Google Maps, is that zooming (via scroll wheel) centers on the mouse cursor position.

In a framework-less environment, this requires manually managing the state of the Viewport:

* zoomLevel: A float representing pixels per millisecond.  
* offsetX: The temporal offset of the left edge of the screen.

The zoom logic, triggered on the wheel event, involves a specific sequence of operations to ensure the point under the mouse remains stationary:

1. Capture Anchor: Calculate the "World Time" currently under the mouse cursor before the zoom is applied.

   $$T\_{mouse} \= \\frac{X\_{mouse}}{Zoom\_{old}} \+ Offset\_{old}$$  
2. **Apply Zoom:** Update the zoomLevel based on the wheel delta (e.g., multiply by 1.1 or 0.9).  
3. Compensate Offset: Recalculate the offsetX so that the anchored World Time maps back to the same mouse X coordinate.

   $$Offset\_{new} \= T\_{mouse} \- \\frac{X\_{mouse}}{Zoom\_{new}}$$

This logic must be handled within the request animation frame loop to ensure smooth, inertial zooming physics.21

## **3\. Algorithmic Layout and Collision Detection**

Beyond rendering dots on a line, a usable timeline must display text labels and duration bars. A naive implementation that simply draws text at the event's time coordinate will result in massive overplotting, where thousands of labels stack on top of each other, creating an illegible black smear. "Handling" this without a framework requires implementing layout algorithms typically found in graph visualization libraries.

### **3.1 1D Bin Packing for Vertical Layout**

To visualize overlapping time intervals (events with a start and end time) without visual collision, the application must assign a vertical "lane" or "track" to each event. This is an instance of the **Interval Coloring Problem** or **1D Bin Packing**.

A "Greedy" algorithm is generally sufficient and performant for this task 23:

1. **Sort:** The dataset must first be sorted by start time.  
2. **Iterate:** The algorithm iterates through events, maintaining a list of "active lanes." Each lane tracks the endTime of the last event placed within it.  
3. **Assign:** For each new event, the algorithm checks the lanes. It places the event in the first lane where Lane.EndTime \< Event.StartTime. If no such lane exists (i.e., all lanes are currently occupied by overlapping events), a new lane is created.

This algorithm runs in $O(N \\log N)$ complexity (dominated by the sort step) and produces a "waterfall" or "staircase" visual structure.25 In a vanilla JS application, this layout calculation should ideally be performed once upon data load, or re-calculated dynamically in a Web Worker if filtering is applied, to avoid blocking the main thread.

### **3.2 Spatial Indexing for Label Collision**

Text labels present a more complex challenge than bars because their width is defined in screen pixels, not time units. As the user zooms in, the screen space between events expands, allowing more labels to fit. As they zoom out, labels collide.

To manage this efficiently, checking every label against every other label for overlap ($O(N^2)$) is computationally prohibitive for large datasets. The solution is to implement a **Spatial Index**, such as a **Quadtree** or a **Spatial Hash**.26

For a 1D timeline, a simple Spatial Hash (or Grid) is often superior to a Quadtree. The screen is divided into vertical buckets (e.g., 50 pixels wide). Each event is mapped to the buckets it intersects. When rendering, the application checks a bucket; if multiple labels fall into it, a prioritization strategy (LOD) determines which one to draw (e.g., based on an "importance" score) and which to hide. This reduces collision detection to near linear time $O(N)$, enabling real-time label decluttering during zoom operations.28

### **3.3 Level of Detail (LOD) Strategies**

Rendering performance and legibility are both served by implementing a Level of Detail system. The application should define discrete zoom thresholds.

* **Macro View:** When the viewport spans centuries, render only events marked as "High Priority" or aggregate events into "Cluster" markers (e.g., "50 Events in this period").  
* **Meso View:** As the user zooms, reveal "Medium Priority" events and simplified labels.  
* **Micro View:** At maximum zoom, render all events with full detailed labels and duration bars.

This filtering logic acts as a "Render Cull" stage. Before the layout algorithm runs, the dataset is filtered based on the current zoom level, ensuring that the layout engine and the renderer only process a manageable subset of the data.30

## **4\. Interaction Design and Input Handling**

In a framework-less environment, the developer is responsible for the entire input pipeline. Unlike the DOM, where an onclick handler can be attached to an element, the Canvas is a single interactive surface.

### **4.1 Hit Detection Strategies**

To determine which event the user is hovering over or clicking, the application must perform **Hit Testing**. Two primary strategies exist:

Geometric (Analytical) Hit Testing:  
This involves maintaining a spatial index (like the Quadtree mentioned above) of visible items. On every mousemove event, the mouse coordinates are transformed into world coordinates and queried against the index.

* *Pros:* Precise, supports hover states efficiently.  
* *Cons:* Requires maintaining a synchronized spatial data structure; math can become complex for irregular shapes.7

Color Picking (GPU) Hit Testing:  
This technique involves rendering a "Shadow Scene" to an off-screen canvas. In this shadow scene, every interactive object is drawn not with its visible colors, but with a unique color that encodes its ID (e.g., Event ID 1 is drawn as \#000001).

* On a click event, the application samples the pixel color at the mouse coordinates from the shadow canvas using ctx.getImageData.  
* The color is decoded back into an ID to retrieve the event object.  
* *Pros:* Pixel-perfect accuracy for complex shapes; $O(1)$ lookup time independent of object count.  
* *Cons:* getImageData is a slow, synchronous operation that causes CPU-GPU pipeline stalls. It is suitable for clicks but generally too slow for 60 FPS hover effects.32

For a timeline, the Geometric approach using a 1D spatial hash is generally preferred due to the simplicity of the shapes (rectangles and points) and the need for high-performance hover feedback (tooltips).

### **4.2 Implementing Inertial Physics**

To achieve a modern "native app" feel, scrolling and panning should include inertia (momentum). When the user drags and releases, the timeline should continue to glide and frictionally decelerate.

In vanilla JS, this requires a physics simulation loop:

1. **Track Velocity:** During the drag event, calculate the velocity ($v \= \\Delta distance / \\Delta time$) of the mouse movement.  
2. **Release:** On mouseup, if the velocity exceeds a threshold, enter a "Decay" state.  
3. **Animation Loop:** In the requestAnimationFrame loop, apply the velocity to the viewport offset, then multiply the velocity by a friction coefficient (e.g., 0.95) per frame.  
4. **Stop:** When velocity drops below a minimum epsilon, terminate the loop.

This implementation detail significantly enhances the perceived quality of the application.34

## **5\. Architectural Patterns: State Management without Frameworks**

A common misconception is that "Vanilla JS" implies unstructured code. On the contrary, managing a complex timeline requires a rigorous architectural pattern, effectively rebuilding a lightweight version of the patterns found in libraries like Redux or Vuex.

### **5.1 The Observer / Pub-Sub Pattern**

To avoid "spaghetti code" where the input handler directly modifies the canvas, the application should implement a **Unidirectional Data Flow** using the Observer Pattern.36

* **The Store:** A single JavaScript class / object that holds the application state (events, viewport, selection, settings). This state should be treated as immutable.  
* **Actions:** Discrete functions that modify the state (e.g., zoomIn(), selectEvent(id)).  
* **Subscribers:** The rendering components (Canvas, HTML Overlay, URL Hash) subscribe to state changes.

When an interaction occurs (e.g., scroll), an Action is dispatched. The Action updates the Store. The Store notifies the Subscribers. The Canvas Subscriber triggers a redraw. This decoupling ensures that the URL hash, the UI controls, and the canvas visualization remain perfectly synchronized without tight coupling.36

### **5.2 The Render Loop and Dirty Checking**

The application requires a main loop driven by requestAnimationFrame. To optimize battery life and CPU usage, the loop should implement **Dirty Checking**. The draw() function should strictly check a isDirty flag in the Store. If the state has not changed since the last frame, the function returns immediately without issuing drawing commands. Actions that modify state set isDirty \= true. This ensures the timeline idles at near 0% CPU usage when the user is not interacting with it.39

## **6\. Data Strategy: Is a Backend Really Necessary?**

The user's query explicitly questions the necessity of a backend. In the context of modern web architecture, the answer is increasingly "No," depending on the volatility and volume of the data.

### **6.1 The "No-Backend" / Static Architecture**

For datasets that are read-heavy and updated infrequently (e.g., historical timelines, project roadmaps), a **Static Architecture** is superior. Data is serialized into static JSON files and hosted on a Content Delivery Network (CDN).

* **Compression:** A text-heavy timeline dataset of 100,000 events might be 50-100MB in raw JSON. Using GZIP or Brotli compression, this can be reduced to 5-10MB, a payload size that modern broadband connections can download in seconds.41  
* **Client-Side Indexing:** Once the data is loaded into the browser's memory, the client is responsible for indexing (sorting, building the quadtree). Modern JavaScript engines (V8, SpiderMonkey) can iterate millions of objects in milliseconds, making client-side searching faster than a network round-trip to a backend.

### **6.2 Advanced Client-Side Storage: IndexedDB**

If the dataset is too large to fit comfortably in RAM (e.g., \>500MB) or requires persistence across sessions, **IndexedDB** provides a robust solution. Unlike localStorage (capped at \~5MB and synchronous), IndexedDB allows storing gigabytes of structured data asynchronously.42

A valid pattern is:

1. **Check:** On load, check if data exists in IndexedDB.  
2. **Fetch:** If not, fetch compressed data chunks from the static host.  
3. **Store:** Hydrate IndexedDB with the data.  
4. **Query:** Use IndexedDB cursors and indices to query only the time range currently visible in the viewport.

This essentially treats the browser as the database server, removing the need for an external SQL/NoSQL backend.43

### **6.3 External Knowledge Graphs (Wikidata/SPARQL)**

For applications visualizing public history, the "Backend" can be outsourced to public endpoints like Wikidata. Wikidata exposes a SPARQL endpoint that allows complex querying of the knowledge graph.

* **CORS:** The Wikidata endpoint (https://query.wikidata.org/sparql) supports Cross-Origin Resource Sharing (CORS), allowing browser-based JavaScript to query it directly without a proxy server.45  
* **Architectural Consideration:** While possible, direct dependencies on external APIs can be fragile (timeouts, rate limits). A hybrid approach is recommended: use a build script (running in CI/CD) to query Wikidata, generate a static JSON file, and deploy that file. This gives the reliability of static hosting with the data richness of a live backend.

### **6.4 When IS a Backend Necessary?**

A custom backend is only required if:

1. **Write Concurrency:** Multiple users need to edit the timeline simultaneously (Real-time collaboration).  
2. **Security:** The data contains sensitive information that cannot be exposed to the client.  
3. **Massive Scale:** The dataset is petabyte-scale (e.g., all log events for a large distributed system) where even indices cannot fit on a client device.

For the standard use case of a "Timeline Visualization," a backend is an unnecessary complexity.

## **7\. Accessibility and Shadow DOM**

A major trade-off of using Canvas is the loss of semantic HTML. A screen reader encountering a \<canvas\> element sees only a bitmap. To meet accessibility standards (WCAG), the vanilla JS implementation must manually bridge this gap.

### **7.1 Shadow DOM Implementation**

The "Best Practice" for Canvas accessibility is to maintain a parallel DOM structure—often inside the Canvas's fallback content or a Shadow DOM subtree—that mirrors the interactive elements on the screen.8

* **Focus Management:** When the user tabs into the timeline, focus should move to these invisible DOM elements.  
* **Semantics:** Each event on the timeline corresponds to a \<button\> or \<a\> element in the hidden DOM, with full aria-label, aria-description, and tabindex attributes.  
* **Synchronization:** When the user navigates via keyboard (Tab/Arrow keys), the visual focus ring on the Canvas must be updated to match the focused hidden element, and the Viewport must auto-pan to keep the element in view.

This requires significant effort: effectively building the UI twice (once pixels, once DOM). However, it is the only way to ensure the tool is usable by assistive technology users.48

## **8\. Conclusion**

Building a high-performance interactive timeline in vanilla JavaScript is not merely a coding exercise but a systems engineering challenge. It requires the developer to assume the responsibilities typically handled by browser layout engines and frameworks: rendering pipelines, memory management, mathematical projection, and state synchronization.

The analysis confirms that avoiding frameworks is not only possible but, for high-density data visualization, often the optimal performance strategy. By utilizing the **HTML5 Canvas** for rendering, **BigInt** for temporal precision, and **IndexedDB** for data persistence, a developer can construct a system capable of visualizing the history of the universe with 60 FPS fluidity. Furthermore, for the majority of visualization use cases, a dedicated backend is architectural over-engineering; the modern browser's capabilities, combined with static data delivery, offer a more robust, cost-effective, and faster user experience.

The implementation roadmap is clear: prioritize the **Hybrid Rendering** model, strictly separate **State from View**, and treat **Accessibility** as a core architectural component rather than an afterthought. This approach yields a timeline that is not just a chart, but a high-performance, navigable instrument for exploring temporal data.

## **9\. Appendix: Performance Benchmark Data Structures**

To assist in the implementation, the following data structure comparison highlights the memory vs. performance trade-offs inherent in the vanilla JS implementation of the timeline Store.

| Data Structure | Use Case | Pros | Cons |
| :---- | :---- | :---- | :---- |
| **Array** Event | Main Storage | Fast iteration, memory efficient. | Slow lookup ($O(N)$) for specific IDs. |
| **Map** ID \-\> Event | Selection / Lookup | Instant access ($O(1)$) by ID. | Higher memory usage than arrays. |
| **Quadtree** | Spatial Queries | Fast hit-testing ($O(\\log N)$). | Complex to update if events move; high build cost. |
| **Sorted Array** | Range Queries | Binary search for visible time range ($O(\\log N)$). | Expensive to insert new items ($O(N)$). |
| **TypedArray** Float32Array | Geometry Buffer | Extremely fast for WebGL transfer. | Fixed size; hard to handle variable text data. |

For a read-heavy timeline, the recommended combination is a **Sorted Array** (by time) for rendering range queries, and a **Map** for selection state management.

# ---

**Detailed Technical Implementation Guide**

## **1\. Core Architecture and State Management**

### **1.1 The Central Store Pattern**

In the absence of frameworks like Redux, implementing a robust state management system is critical to preventing the "spaghetti code" that plagues many vanilla JS projects. The timeline operates on a unidirectional data flow.

The Store should be implemented as a singleton or a class instance that maintains the "Source of Truth."

JavaScript

class TimelineStore {  
    constructor() {  
        this.state \= {  
            viewportStart: 0n, // BigInt for Deep Time  
            viewportEnd: 1000n,  
            zoomLevel: 1.0,  
            events:, // Sorted array of event objects  
            selectedEventIds: new Set(),  
            hoveredEventId: null  
        };  
        this.listeners \= new Set();  
    }

    // Subscribe component to updates  
    subscribe(callback) {  
        this.listeners.add(callback);  
        return () \=\> this.listeners.delete(callback); // Return unsubscribe function  
    }

    // Dispatch an action to mutate state  
    dispatch(actionType, payload) {  
        const previousState \= {...this.state };  
          
        switch(actionType) {  
            case 'PAN':  
                this.state.viewportStart \+= payload.delta;  
                this.state.viewportEnd \+= payload.delta;  
                break;  
            case 'ZOOM':  
                // Complex zoom logic (see Section 2.4)  
                this.\_handleZoom(payload);  
                break;  
            case 'LOAD\_DATA':  
                this.state.events \= payload.sort((a, b) \=\>   
                    (a.time \< b.time)? \-1 : ((a.time \> b.time)? 1 : 0)  
                );  
                break;  
        }

        // Notify listeners if state changed  
        this.\_notify(previousState);  
    }

    \_notify(previousState) {  
        this.listeners.forEach(listener \=\> listener(this.state, previousState));  
    }  
}

This pattern decouples the *Input* (Mouse events) from the *Logic* (State updates) and the *Output* (Canvas rendering). The Canvas renderer simply subscribes to the store and redraws whenever it receives a notification.

### **1.2 The Main Loop**

Traditional web apps rely on event-driven updates. However, for a timeline with physics (inertia) and smooth interaction, a game-loop style architecture using requestAnimationFrame is superior.

JavaScript

let isDirty \= false;

// Mark dirty on state change  
store.subscribe(() \=\> { isDirty \= true; });

function renderLoop() {  
    if (isDirty) {  
        drawScene(store.state);  
        isDirty \= false;  
    }  
    requestAnimationFrame(renderLoop);  
}

This "dirty checking" mechanism is vital. It ensures that if the user is not interacting with the timeline, the browser is doing zero work, saving battery life on mobile devices—a common failing of naive setInterval implementations.39

## **2\. Advanced Rendering Techniques**

### **2.1 The Canvas Layering Strategy**

To achieve 60 FPS, we must minimize the amount of work done per frame. The "Sandwich Pattern" mentioned in the Executive Summary should be implemented using multiple HTML5 \<canvas\> elements stacked via CSS absolute positioning.

1. **Grid Canvas (z-index: 0):** Draws the vertical time markers (years, centuries). This layer only needs to redraw when the *Zoom* changes or the *Viewport* pans significantly. It can be cached or drawn less frequently.  
2. **Data Canvas (z-index: 1):** Draws the actual event bars and connections. This is the heaviest layer and needs high-performance optimization.  
3. **Interaction/Hit Canvas (z-index: 2):** This is a transparent canvas used to capture mouse events. Alternatively, this can be purely virtual (in memory) for hit testing.  
4. **UI Overlay (z-index: 3):** A standard HTML \<div\> container. When an event is selected, an HTML tooltip is appended here.

### **2.2 Text Rendering Optimization**

Canvas text rendering (ctx.fillText) is notoriously slow compared to drawing rectangles. If the timeline shows 1,000 labels, rendering them every frame will drop the frame rate.

**Optimization Strategies:**

* **Text Culling:** Do not render text for events that are too small (e.g., if the event bar is \< 20px wide).  
* **Texture Atlas (Advanced):** For static labels, pre-render the text onto a hidden canvas and then use ctx.drawImage to copy the bitmap. drawImage is significantly faster than fillText.  
* **HTML Labels:** For the highest quality, do not draw text on canvas at all. Use the UI Overlay layer. Create a pool of \<div\> elements and absolute-position them over the canvas events. This leverages the browser's highly optimized text layout engine, though it reintroduces DOM overhead. A hybrid is best: draw "summary" text on Canvas, and detail text in DOM on hover.

## **3\. Handling Deep Time (The BigInt Implementation)**

### **3.1 The Time Scale Class**

Since Date is unusable for deep time, we create a TimeScale utility.

JavaScript

const TIME\_UNIT \= {  
    SECOND: 1n,  
    YEAR: 31557600n, // Approx seconds in a year  
    BILLION\_YEARS: 31557600000000000n  
};

// Example: Origin (0n) \= Jan 1, 2000  
// 1 Billion Years Ago  
const deepPast \= \-1n \* TIME\_UNIT.BILLION\_YEARS;

function formatTime(bigIntTime) {  
    if (bigIntTime \> \-10000n && bigIntTime \< 10000n) {  
        // Use standard formatter for near-present  
        return new Date(Number(bigIntTime) \* 1000).getFullYear();  
    }  
    // Custom formatter for deep time  
    const years \= bigIntTime / TIME\_UNIT.YEAR;  
    if (years \< \-1000000000n) return \`${-years / 1000000000n} Ga\`;  
    if (years \< \-1000000n) return \`${-years / 1000000n} Ma\`;  
    return \`${years} Years\`;  
}

### **3.2 Viewport Projection**

The projection function converts the BigInt time to a pixel coordinate.

JavaScript

function project(time, state) {  
    // 1\. Calculate BigInt Delta (Safe)  
    const delta \= time \- state.viewportStart;  
      
    // 2\. Cast to Number (Safe, because visible delta is relative to screen)  
    // Even if World Time is 14 Billion years, the visible range might be only 100 years.  
    // The delta fits in a standard Number.  
    const deltaNumber \= Number(delta);  
      
    // 3\. Scale  
    return deltaNumber \* state.zoomFactor;  
}

This local-offset method is the standard solution for the "Jitter" problem in game development (often called "Floating Origin") and applies perfectly here.20

## **4\. Algorithmic Layouts**

### **4.1 Implementing the Waterfall Layout**

When users zoom out, events overlap. We need a fast, deterministic way to stack them. The Greedy Interval Packing algorithm is the industry standard.

JavaScript

function computeLayout(events) {  
    // 1\. Sort by start time (O(N log N))  
    const sorted \= events.sort((a, b) \=\> Number(a.start \- b.start));  
      
    const lanes \=; // Stores the 'end time' of the last item in each lane  
      
    sorted.forEach(event \=\> {  
        let placed \= false;  
          
        // 2\. Find first lane where this event fits  
        for (let i \= 0; i \< lanes.length; i++) {  
            if (lanes\[i\] \< event.start) {  
                event.lane \= i;  
                lanes\[i\] \= event.end;  
                placed \= true;  
                break;  
            }  
        }  
          
        // 3\. If no lane fits, create a new one  
        if (\!placed) {  
            event.lane \= lanes.length;  
            lanes.push(event.end);  
        }  
    });  
      
    return lanes.length; // Total height needed  
}

This computation should happen in the LOAD\_DATA action. For massive datasets, this function should be moved to a **Web Worker**. The Worker receives the events, computes the lane index for each, and sends the annotated data back to the main thread. This ensures the UI remains responsive during the layout calculation.49

## **5\. Interaction and Physics**

### **5.1 Implementing Inertia (Kinetic Scrolling)**

Native-feeling scrolling requires momentum.

JavaScript

let velocity \= 0;  
let isDragging \= false;  
let lastMouseX \= 0;  
let lastTimestamp \= 0;

canvas.addEventListener('mousemove', e \=\> {  
    if (\!isDragging) return;  
    const now \= performance.now();  
    const dt \= now \- lastTimestamp;  
    const dx \= e.clientX \- lastMouseX;  
      
    // Calculate instantaneous velocity  
    velocity \= dx / dt;   
      
    store.dispatch('PAN', { delta: \-dx }); // Direct manipulation  
      
    lastMouseX \= e.clientX;  
    lastTimestamp \= now;  
});

canvas.addEventListener('mouseup', () \=\> {  
    isDragging \= false;  
    requestAnimationFrame(inertiaLoop);  
});

function inertiaLoop() {  
    if (isDragging |

| Math.abs(velocity) \< 0.01) return;  
      
    // Apply velocity  
    store.dispatch('PAN', { delta: \-velocity \* 16 }); // 16ms frame  
      
    // Apply Friction  
    velocity \*= 0.95;   
      
    requestAnimationFrame(inertiaLoop);  
}

This simple physics model (Velocity \* Friction) creates the "throw" effect users expect on touch devices and trackpads.

## **6\. Accessibility Implementation**

Since the Canvas is a black box, we must provide an alternative interface.

### **6.1 The "Parallel DOM" Strategy**

We create a \<ul\> list that is visually hidden (using clip or opacity, not display: none as screen readers ignore that) but contains all the events currently visible on the timeline.

HTML

\<div id\="canvas-container" role\="application" aria-label\="Interactive Timeline"\>  
    \<canvas id\="timeline-canvas"\>\</canvas\>  
    \<ul id\="a11y-list" class\="sr-only"\>  
        \<li\>\<button onclick\="selectEvent(1)"\>Big Bang \- 13.8 BYA\</button\>\</li\>  
        \<li\>\<button onclick\="selectEvent(2)"\>Formation of Earth \- 4.5 BYA\</button\>\</li\>  
    \</ul\>  
\</div\>

**Synchronization Logic:**

1. **On Render:** The draw() function calculates which events are visible. It updates the a11y-list DOM to contain buttons for these events.  
2. **On Focus:** When a user Tabs into the a11y-list, the application detects the focus event.  
3. **Auto-Pan:** The application dispatches a PAN action to center the timeline on the focused event.  
4. **Selection:** Pressing Enter on the button triggers the visual selection state on the canvas.

This ensures that a blind user can navigate the timeline chronologically using standard keyboard controls, satisfying WCAG requirements.8

## **7\. Data Backend and SPARQL Integration**

### **7.1 Direct SPARQL Querying**

To visualize history without a backend, we can query Wikidata directly.

The Query Builder:  
Construct a SPARQL query to get data (e.g., "Space Missions").

Code snippet

SELECT?item?itemLabel?date WHERE {  
 ?item wdt:P31 wd:Q595871. \# Instance of Space Mission  
 ?item wdt:P619?date.     \# Launch Date  
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }  
}  
LIMIT 1000

**The Fetch Implementation:**

JavaScript

const endpoint \= "https://query.wikidata.org/sparql";  
const sparql \= "..."; // Query above  
const url \= \`${endpoint}?query=${encodeURIComponent(sparql)}\&format=json\`;

fetch(url, {  
    headers: { 'Accept': 'application/sparql-results+json' }  
})  
.then(response \=\> response.json())  
.then(data \=\> {  
    // Transform Wikidata JSON to our internal Event format  
    const events \= data.results.bindings.map(b \=\> ({  
        id: b.item.value,  
        label: b.itemLabel.value,  
        time: parseWikidataDate(b.date.value) // Custom parser needed  
    }));  
    store.dispatch('LOAD\_DATA', events);  
});

This code runs entirely in the browser. No Python/Node.js backend is required. The parseWikidataDate function is critical: it must handle ISO dates that include negative years (BC) which standard Date.parse often mishandles.46

### **7.2 Handling CORS**

Wikidata sends the header Access-Control-Allow-Origin: \*. This allows any domain (including localhost or your GitHub Pages site) to request data. If you were querying a private API that did *not* have this header, you would *then* need a backend proxy (e.g., a simple Node.js Express server) to strip the CORS restrictions. But for public data, this is rarely needed.45

## **8\. Summary of Requirements Checklist**

| Requirement | Implementation Strategy |
| :---- | :---- |
| **No Framework** | Native ES6 Modules, Classes for Store/Renderer. |
| **High Performance** | HTML5 Canvas, Render Loop, Virtual Scrolling. |
| **Large Data** | IndexedDB for storage, Binary Search for culling. |
| **Deep Time** | BigInt scalar coordinates, Floating Origin. |
| **Layout** | Greedy Interval Packing (Waterfall). |
| **Interaction** | Mouse/Touch Listeners \+ Inertial Physics Loop. |
| **Backend** | None. Static JSON \+ SPARQL \+ IndexedDB. |
| **Accessibility** | Parallel Shadow DOM / Hidden List. |

This architecture represents the "State of the Art" for vanilla JavaScript development in 2026\. It rejects the bloat of frameworks in favor of precise, mathematical control over the rendering pipeline, resulting in an application that is faster, lighter, and more capable of handling the extreme demands of temporal visualization.

#### **Works cited**

1. SVG vs Canvas: Choosing the Right Tool for Your Graphics | by Mahesh Kedari | Medium, accessed January 12, 2026, [https://medium.com/@kedari.mahesh/svg-vs-canvas-choosing-the-right-tool-for-your-graphics-bd584a22e3c0](https://medium.com/@kedari.mahesh/svg-vs-canvas-choosing-the-right-tool-for-your-graphics-bd584a22e3c0)  
2. HTML5 Canvas vs. SVG: Which Should You Use for Graphics and Animations? \- Xyris, accessed January 12, 2026, [https://xyris.app/blog/html5-canvas-vs-svg-which-should-you-use-for-graphics-and-animations/](https://xyris.app/blog/html5-canvas-vs-svg-which-should-you-use-for-graphics-and-animations/)  
3. SVG versus Canvas: Which technology to choose and why? \- JointJS, accessed January 12, 2026, [https://www.jointjs.com/blog/svg-versus-canvas](https://www.jointjs.com/blog/svg-versus-canvas)  
4. Render time, event response time of Chrome are too bad \- Stack Overflow, accessed January 12, 2026, [https://stackoverflow.com/questions/13193298/render-time-event-response-time-of-chrome-are-too-bad](https://stackoverflow.com/questions/13193298/render-time-event-response-time-of-chrome-are-too-bad)  
5. HTML5 Canvas vs. SVG vs. div \- Stack Overflow, accessed January 12, 2026, [https://stackoverflow.com/questions/5882716/html5-canvas-vs-svg-vs-div](https://stackoverflow.com/questions/5882716/html5-canvas-vs-svg-vs-div)  
6. Optimising HTML5 Canvas Rendering: Best Practices and Techniques \- AG Grid Blog, accessed January 12, 2026, [https://blog.ag-grid.com/optimising-html5-canvas-rendering-best-practices-and-techniques/](https://blog.ag-grid.com/optimising-html5-canvas-rendering-best-practices-and-techniques/)  
7. Canvas Hit Detection Methods \- With or Without Tolerances \- Joshua Tzucker, accessed January 12, 2026, [https://joshuatz.com/posts/2022/canvas-hit-detection-methods/](https://joshuatz.com/posts/2022/canvas-hit-detection-methods/)  
8. AddedElementCanvas \- HTML WG Wiki \- W3C, accessed January 12, 2026, [https://www.w3.org/html/wg/wiki/AddedElementCanvas](https://www.w3.org/html/wg/wiki/AddedElementCanvas)  
9. 7 Advanced JavaScript \+ Canvas Techniques for Data Visualization \- Medium, accessed January 12, 2026, [https://medium.com/uxdworld/7-advanced-javascript-canvas-techniques-for-data-visualization-e6236d72b754](https://medium.com/uxdworld/7-advanced-javascript-canvas-techniques-for-data-visualization-e6236d72b754)  
10. What range of dates are permitted in Javascript? \- Stack Overflow, accessed January 12, 2026, [https://stackoverflow.com/questions/12666127/what-range-of-dates-are-permitted-in-javascript](https://stackoverflow.com/questions/12666127/what-range-of-dates-are-permitted-in-javascript)  
11. Date \- JavaScript \- MDN Web Docs \- Mozilla, accessed January 12, 2026, [https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global\_Objects/Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)  
12. How do I display BC/AD or other era indicators? \- JavaScript i18n \- Lingo.dev, accessed January 12, 2026, [https://lingo.dev/en/javascript-i18n/display-date-era-indicators](https://lingo.dev/en/javascript-i18n/display-date-era-indicators)  
13. Temporal \- JavaScript \- MDN Web Docs \- Mozilla, accessed January 12, 2026, [https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global\_Objects/Temporal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal)  
14. BigInt \- JavaScript \- MDN Web Docs, accessed January 12, 2026, [https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global\_Objects/BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt)  
15. BigInt() constructor \- JavaScript \- MDN Web Docs, accessed January 12, 2026, [https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global\_Objects/BigInt/BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt/BigInt)  
16. Geologic time scale \- Wikipedia, accessed January 12, 2026, [https://en.wikipedia.org/wiki/Geologic\_time\_scale](https://en.wikipedia.org/wiki/Geologic_time_scale)  
17. Ancient dates \- Guy Pursey, accessed January 12, 2026, [https://guypursey.com/blog/201610172000-ancient-dates](https://guypursey.com/blog/201610172000-ancient-dates)  
18. OpenGL texture coordinates and the precision of small floats \- Stack Overflow, accessed January 12, 2026, [https://stackoverflow.com/questions/9271342/opengl-texture-coordinates-and-the-precision-of-small-floats](https://stackoverflow.com/questions/9271342/opengl-texture-coordinates-and-the-precision-of-small-floats)  
19. How to Solve Floating-Point Precision Issues for Geospatial Rendering in OpenGL?, accessed January 12, 2026, [https://community.khronos.org/t/how-to-solve-floating-point-precision-issues-for-geospatial-rendering-in-opengl/111558](https://community.khronos.org/t/how-to-solve-floating-point-precision-issues-for-geospatial-rendering-in-opengl/111558)  
20. To avoid floating point precision errors from far distances from the origin \- Reddit, accessed January 12, 2026, [https://www.reddit.com/r/VoxelGameDev/comments/numis9/to\_avoid\_floating\_point\_precision\_errors\_from\_far/](https://www.reddit.com/r/VoxelGameDev/comments/numis9/to_avoid_floating_point_precision_errors_from_far/)  
21. Tutorial: Drawable and Pannable-Zoomable Canvas in Vanilla JS | by Abdullah Ahmad, accessed January 12, 2026, [https://abdullahaak06.medium.com/tutorial-drawable-and-pannable-zoomable-canvas-in-vanilla-js-0f9e6acd35df](https://abdullahaak06.medium.com/tutorial-drawable-and-pannable-zoomable-canvas-in-vanilla-js-0f9e6acd35df)  
22. Panning and Zooming in HTML Canvas | Harrison Milbradt, accessed January 12, 2026, [https://harrisonmilbradt.com/blog/canvas-panning-and-zooming](https://harrisonmilbradt.com/blog/canvas-panning-and-zooming)  
23. Algorithm for packing time slots \- combinatorics \- Stack Overflow, accessed January 12, 2026, [https://stackoverflow.com/questions/25683078/algorithm-for-packing-time-slots](https://stackoverflow.com/questions/25683078/algorithm-for-packing-time-slots)  
24. Algorithm to discretize overlapping ranges \- python \- Stack Overflow, accessed January 12, 2026, [https://stackoverflow.com/questions/76566088/algorithm-to-discretize-overlapping-ranges](https://stackoverflow.com/questions/76566088/algorithm-to-discretize-overlapping-ranges)  
25. Timeline stacking problem · Issue \#611 · visjs/vis \- GitHub, accessed January 12, 2026, [https://github.com/visjs/vis/issues/611](https://github.com/visjs/vis/issues/611)  
26. R-Tree and Quadtree Comparison \- Stack Overflow, accessed January 12, 2026, [https://stackoverflow.com/questions/23216261/r-tree-and-quadtree-comparison](https://stackoverflow.com/questions/23216261/r-tree-and-quadtree-comparison)  
27. Quadtree vs R-tree / Fati CHEN \- Observable Notebooks, accessed January 12, 2026, [https://observablehq.com/@stardisblue/quadtree-vs-rtree](https://observablehq.com/@stardisblue/quadtree-vs-rtree)  
28. Redesign Your Display List With Spatial Hashes | Envato Tuts+ \- Code, accessed January 12, 2026, [https://code.tutsplus.com/redesign-your-display-list-with-spatial-hashes--cms-27586t](https://code.tutsplus.com/redesign-your-display-list-with-spatial-hashes--cms-27586t)  
29. Coding Spatial Hash Tables | XPBD \- Carmen's Graphics Blog, accessed January 12, 2026, [https://carmencincotti.com/2022-11-14/coding-spatial-hash-tables/](https://carmencincotti.com/2022-11-14/coding-spatial-hash-tables/)  
30. JavaScript performance optimization \- Learn web development | MDN, accessed January 12, 2026, [https://developer.mozilla.org/en-US/docs/Learn\_web\_development/Extensions/Performance/JavaScript](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Performance/JavaScript)  
31. Optimising Large Data Set Visualisations with the M4 Algorithm \- AG Grid Blog, accessed January 12, 2026, [https://blog.ag-grid.com/optimizing-large-data-set-visualisations-with-the-m4-algorithm/](https://blog.ag-grid.com/optimizing-large-data-set-visualisations-with-the-m4-algorithm/)  
32. Advanced hit-test HTML Canvas tutorial \- YouTube, accessed January 12, 2026, [https://www.youtube.com/watch?v=KD\_f-XbdIlk](https://www.youtube.com/watch?v=KD_f-XbdIlk)  
33. When does using GPU picking make sense? \- Questions \- Babylon.js Forum, accessed January 12, 2026, [https://forum.babylonjs.com/t/when-does-using-gpu-picking-make-sense/58886](https://forum.babylonjs.com/t/when-does-using-gpu-picking-make-sense/58886)  
34. Optimizing canvas \- Web APIs | MDN, accessed January 12, 2026, [https://developer.mozilla.org/en-US/docs/Web/API/Canvas\_API/Tutorial/Optimizing\_canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)  
35. TimeLineLite timing accuracy (usable in behavioural reaction time based research?) \- GSAP, accessed January 12, 2026, [https://gsap.com/community/forums/topic/15548-timelinelite-timing-accuracy-usable-in-behavioural-reaction-time-based-research/](https://gsap.com/community/forums/topic/15548-timelinelite-timing-accuracy-usable-in-behavioural-reaction-time-based-research/)  
36. Understanding the Observer Pattern in Vanilla JavaScript | Your Site Name, accessed January 12, 2026, [https://synchronizedcodelab.com/blogs/observer-pattern-in-javascript](https://synchronizedcodelab.com/blogs/observer-pattern-in-javascript)  
37. State Management Patterns in Vanilla JavaScript | by Mark Onyango | Dec, 2025 \- Medium, accessed January 12, 2026, [https://medium.com/@mark.onyango\_95482/state-management-patterns-in-vanilla-javascript-ff7f55ef1a87](https://medium.com/@mark.onyango_95482/state-management-patterns-in-vanilla-javascript-ff7f55ef1a87)  
38. Build a state management system with vanilla JavaScript \- CSS-Tricks, accessed January 12, 2026, [https://css-tricks.com/build-a-state-management-system-with-vanilla-javascript/](https://css-tricks.com/build-a-state-management-system-with-vanilla-javascript/)  
39. Improving HTML5 Canvas performance | Articles \- web.dev, accessed January 12, 2026, [https://web.dev/articles/canvas-performance](https://web.dev/articles/canvas-performance)  
40. JavaScript performance is weird... Write scientifically faster code with benchmarking, accessed January 12, 2026, [https://www.youtube.com/watch?v=\_pWA4rbzvIg](https://www.youtube.com/watch?v=_pWA4rbzvIg)  
41. Storing temporary client side data \- javascript \- Stack Overflow, accessed January 12, 2026, [https://stackoverflow.com/questions/27798248/storing-temporary-client-side-data](https://stackoverflow.com/questions/27798248/storing-temporary-client-side-data)  
42. LocalStorage vs IndexedDB: JavaScript Guide (Storage, Limits & Best Practices), accessed January 12, 2026, [https://dev.to/tene/localstorage-vs-indexeddb-javascript-guide-storage-limits-best-practices-fl5](https://dev.to/tene/localstorage-vs-indexeddb-javascript-guide-storage-limits-best-practices-fl5)  
43. LocalStorage vs IndexedDB: Choosing the Right Solution for Your Web Application, accessed January 12, 2026, [https://shiftasia.com/community/localstorage-vs-indexeddb-choosing-the-right-solution-for-your-web-application/](https://shiftasia.com/community/localstorage-vs-indexeddb-choosing-the-right-solution-for-your-web-application/)  
44. Using IndexedDB \- Web APIs \- MDN Web Docs, accessed January 12, 2026, [https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB\_API/Using\_IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)  
45. Enabling Cross-Origin Resource Sharing (CORS) on a Virtuoso SPARQL Endpoint, accessed January 12, 2026, [https://vos.openlinksw.com/VOS/VirtTipsAndTricksCORsEnableSPARQLURLs](https://vos.openlinksw.com/VOS/VirtTipsAndTricksCORsEnableSPARQLURLs)  
46. How to query Wikidata using SPARQL in JavaScript \- Leskoff, accessed January 12, 2026, [https://www.leskoff.com/s02209-0](https://www.leskoff.com/s02209-0)  
47. HTML Accessibility \- Paul J. Adam, accessed January 12, 2026, [https://pauljadam.com/demos/canvas.html](https://pauljadam.com/demos/canvas.html)  
48. CSS and JavaScript accessibility best practices \- Learn web development | MDN, accessed January 12, 2026, [https://developer.mozilla.org/en-US/docs/Learn\_web\_development/Core/Accessibility/CSS\_and\_JavaScript](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Accessibility/CSS_and_JavaScript)  
49. Using Interval Trees to Compute Interval Intersections — Fast | by Sean Moran | Medium, accessed January 12, 2026, [https://medium.com/@sean.j.moran/using-interval-trees-to-compute-interval-intersections-fast-e37213a39391](https://medium.com/@sean.j.moran/using-interval-trees-to-compute-interval-intersections-fast-e37213a39391)  
50. Interval Tree \- GeeksforGeeks, accessed January 12, 2026, [https://www.geeksforgeeks.org/dsa/interval-tree/](https://www.geeksforgeeks.org/dsa/interval-tree/)  
51. Best Practices for Canvas Accessibility \- Disability and Access \- The University of Texas at Austin, accessed January 12, 2026, [https://disability.utexas.edu/wp-content/uploads/2020/03/SSD-CANVAS-Best-Practices\_2020.pdf](https://disability.utexas.edu/wp-content/uploads/2020/03/SSD-CANVAS-Best-Practices_2020.pdf)  
52. Passing your own data to use in Wikidata visualizations \- Bob DuCharme, accessed January 12, 2026, [https://www.bobdc.com/blog/your-values-wikidata/](https://www.bobdc.com/blog/your-values-wikidata/)