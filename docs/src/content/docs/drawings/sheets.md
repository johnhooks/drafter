---
title: Drawing Sheets
description: Create scaled line drawings and pictorial views of the finished model, then print or export them.
---

Drawing sheets show the finished bodies as scaled line drawings or isometric images. Each sheet holds one view on a US letter page with a title block. Orthographic views have solid visible edges and dashed hidden edges; isometric views show the 3D rendering at a selected projected scale. Both follow model edits automatically.

## Create a sheet

From the model toolbar, choose **Sheets**, then **Add Sheet**. Choose Front, Top, Left, Right, or Isometric, then press **Create**. The default is Front. New sheets show the whole model in landscape orientation at the largest standard scale that fits the chosen projection. Empty targets start at 1:1; targets too large for every listed scale start at 1:24 with a warning. **Cancel** creates nothing and does not consume a default sheet number. Use **Model** to return to modelling.

Select a sheet in the list to edit its name, page orientation, target body, and scale. Its view is read-only, including on sheets loaded from older files. To show another direction, create another sheet. **Move up** and **Move down** change its position in the list and its sheet number in the title block. **Delete Sheet** asks for confirmation. Creation is one undo step; sheet edits and deletion can also be undone.

Default names count upward without reusing deleted numbers, even after saving and reopening the file. Renaming a sheet does not reset the counter.

## Set the target and scale

Choose either the whole model or a single body as the target. The view is centred inside the page's 1/2" margins and title block area. A missing target body leaves an empty view with a warning naming the body.

Available scales for every view are 1:1, 1:2, 1:4, 1:8, 1:12, 1:16, and 1:24. At 1:4, a 24" edge parallel to the camera plane is 6" on paper; at 1:8 it is 3". Changing the model, page orientation, or target keeps your chosen scale and recentres the view. Scale edits can be undone, and saving and reopening preserves the selected ratio without fitting it again.

:::note[Isometric scale measures the projection]
The ratio applies to lengths projected into the camera plane. Oblique edges remain foreshortened, so measuring them on paper does not give their true model length. Dimensions remain unavailable on isometric sheets.
:::

:::caution[An oversized view is clipped]
Choosing a scale too large for the drawing area shows a warning. The view keeps that scale; it is not silently shrunk to fit. Choose a smaller scale to show the whole view.
:::

The title block includes the document title, sheet name, view, scale, last-change date, sheet number, and a 1" reference bar. Line weights and dash lengths stay the same size on paper at every scale. Sheets contain the model view and your annotations, not the sketch's constraint marks or labels.

## Capture an isometric view

Rotate the model to the angle you want before opening **Sheets**. Choose **Isometric** in **Add Sheet**, then press **Create** to capture the current model camera's azimuth and elevation. Any model camera angle can be used. Pan and zoom are not captured; the target is centred at the initial fitting ratio and rendered at 300 DPI.

The captured orientation is fixed. Moving the model camera afterward leaves the sheet unchanged. Model, target, scale, or page orientation edits regenerate the image at the saved angle. Only a scale edit changes the ratio; a view that outgrows the drawing area warns and clips. Saving and reopening the document, or undoing and redoing creation, preserves the captured angle and ratio.

## Place dimensions

On an orthographic sheet, choose **Dimension** or press **D**. Click the first point, the second point, then where the dimension line should sit. Moving above or below the points places a horizontal measurement; moving beside them places a vertical measurement. The preview shows the orientation before you commit. **Escape** cancels placement.

Dimensions are unavailable on isometric sheets: the button is disabled and **D** does nothing. Selecting an isometric sheet during dimension placement cancels the pending dimension and activates Select.

Picked points and the edges meeting them stay blue while you place the dimension. Small markers identify the exact measured points. These highlights disappear when you finish, cancel, or switch tools, and are not printed or exported.

Points snap to visible and hidden corners, then edge coordinates, then the 1/16" grid. A dimension measures the true horizontal or vertical distance, not the printed distance. A 24" measurement still reads 24" when you change the scale from 1:4 to 1:8. Short dimensions place the text outside their extension lines. Text stays 3/32" high on paper.

Visible edges on orthographic sheets use a heavier 0.50 mm stroke; hidden dashed edges, dimension strokes, and note leaders use 0.25 mm. These widths are fixed on paper and match in the preview, SVG export, and printing at 100%. Isometric images keep their rendered edge appearance; their note leaders use the thin stroke.

Dimension extension lines start 1/16" away from their measured points and extend 1/16" past the dimension line. If you place the dimension line within that gap, its extension is omitted; its ticks, label, and measurement remain. Note leaders still reach their endpoints without a gap.

:::caution[Dimensions do not follow edited edges]
Dimensions keep their stored points after model edits. If either point no longer lies on the projected geometry, the dimension turns orange and appears in the sheet's warnings. Its value is unchanged. Check and update the points when the model changes.
:::

## Add notes

Notes are available on every sheet. Choose **Note** or press **N**, then click a position on the page. Type the note and press **Enter** to place it, **Shift+Enter** for a new line, or **Escape** to cancel. For a leader arrow, hold **Shift** and drag from the note text to the desired endpoint. On orthographic sheets, the endpoint uses the same snapping as dimension points. On isometric sheets, it is placed directly on the paper without snapping to the image.

Note text stays at its position on the paper when you change scale. Orthographic leader endpoints stay at their stored position in the view. Note text prints at 3/32" high.

:::caution[Isometric leaders stay on the paper]
An isometric leader keeps its paper position through scale and model edits and saving and reopening the document. It is not attached to the model, so check its endpoint after changing the scale, geometry, or target.
:::

## Edit annotations

Choose **Select** or press **A**, then click an annotation. Drag a dimension to move its dimension line without changing the measured points, or drag a note to move its text. Double-click a note to edit its text. Use the selected annotation's properties for typed edits.

**Delete** or **Backspace** removes the selected annotation. Each placement, drag, or committed edit is one undo step. **Cmd+Z** (**Ctrl+Z** elsewhere) restores it.

## Navigate the page

Zoom with the wheel around the pointer. Pan with the middle mouse button, or hold Space while dragging. **Fit** or **F** shows the whole page. **Escape** cancels pending work, then clears selection. Model view keys such as **1** do not act in Sheets mode; **A**, **D**, and **N** select the sheet tools, with **D** available only on orthographic sheets. Navigating the page does not change the captured isometric orientation or printed image.

## Print or export

**Print Sheet** or the browser's Print command prints the selected sheet. **Print All** prints every sheet in list order. In the browser print dialog, choose US letter, 100% scale, no added margins, and no browser headers or footers. Check the title block's 1" bar against a ruler on the printed page.

:::caution[Mixed page orientations]
Some browsers apply one orientation to every printed page. Check the preview when portrait and landscape sheets are mixed. If the orientations are not preserved, print each sheet separately or export it as SVG.
:::

**More → Export sheet as SVG** downloads the selected page at its paper size, including its title block and annotations. An isometric sheet embeds its 300 DPI PNG image in the SVG, so the file opens on its own without an external image. The same image is used for printing. The file carries its own colours, line styles, and page dimensions, without depending on the app's theme. **Download JSON** preserves all sheets, captured camera orientations, and annotations along with the model; images are regenerated when the document opens.
