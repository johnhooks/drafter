---
title: Drawing Sheets
description: Create scaled line drawings from the finished model, then print or export them.
---

Drawing sheets show the finished bodies as black-on-white line drawings. Each sheet holds one view on a US letter page, with a title block and a scale. Visible edges are solid; hidden edges are dashed. The view follows model edits automatically.

## Create a sheet

From the model toolbar, choose **Sheets**, then **Add Sheet**. The new sheet shows the whole model from the front, in landscape orientation, at the largest standard scale that fits. Use **Model** to return to modelling.

Select a sheet in the list to edit its name, orientation, view, target body, and scale. **Move up** and **Move down** change its position in the list and its sheet number in the title block. **Delete Sheet** asks for confirmation. Sheet edits, including creation and deletion, can be undone.

Default names count upward without reusing deleted numbers, even after saving and reopening the file. Renaming a sheet does not reset the counter.

## Choose a view and scale

Choose Front, Top, Left, or Right, and either the whole model or a single body. The view is centred inside the page's 1/2" margins and title block area. A missing target body leaves an empty view with a warning naming the body.

Available scales are 1:1, 1:2, 1:4, 1:8, 1:12, 1:16, and 1:24. At 1:4, a 24" model edge is 6" on paper. Changing the page orientation or target keeps your chosen scale.

:::caution[An oversized view is clipped]
Choosing a scale too large for the drawing area shows a warning. The view keeps that scale; it is not silently shrunk to fit. Choose a smaller scale to show the whole view.
:::

The title block includes the document title, sheet name, view, scale, last-change date, sheet number, and a 1" reference bar. Line weights and dash lengths stay the same size on paper at every scale. Sheets contain the projected geometry and your annotations, not the sketch's constraint marks or labels.

## Place dimensions

Choose **Dimension** or press **D**. Click the first point, the second point, then where the dimension line should sit. Moving above or below the points places a horizontal measurement; moving beside them places a vertical measurement. The preview shows the orientation before you commit. **Escape** cancels placement.

Picked points and the edges meeting them stay blue while you place the dimension. Small markers identify the exact measured points. These highlights disappear when you finish, cancel, or switch tools, and are not printed or exported.

Points snap to visible and hidden corners, then edge coordinates, then the 1/16" grid. A dimension measures the true horizontal or vertical distance, not the printed distance. A 24" measurement still reads 24" when you change the scale from 1:4 to 1:8. Short dimensions place the text outside their extension lines. Text stays 3/32" high on paper.

:::caution[Dimensions do not follow edited edges]
Dimensions keep their stored points after model edits. If either point no longer lies on the projected geometry, the dimension turns orange and appears in the sheet's warnings. Its value is unchanged. Check and update the points when the model changes.
:::

## Add notes

Choose **Note** or press **N**, then click a position on the page. Type the note and press **Enter** to place it, **Shift+Enter** for a new line, or **Escape** to cancel. For a leader arrow, hold **Shift** and drag from the note text to a point on the geometry. The arrow endpoint uses the same snapping as dimension points.

Note text stays at its position on the paper when you change scale. Leader endpoints stay at their stored position in the view. Note text prints at 3/32" high.

## Edit annotations

Choose **Select** or press **A**, then click an annotation. Drag a dimension to move its dimension line without changing the measured points, or drag a note to move its text. Double-click a note to edit its text. Use the selected annotation's properties for typed edits.

**Delete** or **Backspace** removes the selected annotation. Each placement, drag, or committed edit is one undo step. **Cmd+Z** (**Ctrl+Z** elsewhere) restores it.

## Navigate the page

Zoom with the wheel around the pointer. Pan with the middle mouse button, or hold Space while dragging. **Fit** or **F** shows the whole page. **Escape** cancels pending work, then clears selection. Model view keys such as **1** do not act in Sheets mode; **A**, **D**, and **N** select the sheet tools.

## Print or export

**Print Sheet** or the browser's Print command prints the selected sheet. **Print All** prints every sheet in list order. In the browser print dialog, choose US letter, 100% scale, no added margins, and no browser headers or footers. Check the title block's 1" bar against a ruler on the printed page.

:::caution[Mixed page orientations]
Some browsers apply one orientation to every printed page. Check the preview when portrait and landscape sheets are mixed. If the orientations are not preserved, print each sheet separately or export it as SVG.
:::

**More → Export sheet as SVG** downloads the selected page at its paper size, including its title block, dimensions, and notes. The file carries its own colours, line styles, and page dimensions, without depending on the app's theme. **Download JSON** preserves all sheets and their annotations along with the model.
