import Button from 'classes/Button';
import Modal from 'classes/Modal';
import StringSelectMenu from 'classes/StringSelectMenu';
import { Collection } from 'discord.js';

/** Regex for extracting content from [] */
const EXTRACTION_REGEX = /\[(.*?)\]/g;
const DASH_REGEX = /\-/g;

/**
 * Returns an array of strings from the route that does not match the item with the same array index of the itemId
 * @param itemId The itemId to parse
 * @param route The route to parse
 */
const getUnmatchingData = (itemId: string, route: string): string[] => {
  const itemSegments = itemId.split(DASH_REGEX);
  const routeSegments = route.split(DASH_REGEX);

  return routeSegments.filter((segment, idx) => itemSegments[idx] !== segment);
};

/**
 * Similar to getUnmatchingData but this returns the indices instead of the value
 * @param itemId The itemId to parse
 * @param route The route to parse
 */
const getUnmatchingDataIndices = (
  itemId: string,
  route: string
): number[][] => {
  const itemSegments = itemId.split(DASH_REGEX);
  const routeSegments = route.split(DASH_REGEX);
  const indices: number[][] = [];

  routeSegments.forEach((segment, idx) => {
    if (itemSegments[idx] === segment) return;

    // The lengths of the segments combined + the amount of '-' (equals to idx)
    const startIndex =
      itemSegments.slice(0, idx).reduce((a, b) => a + b.length, 0) + idx;
    const endIndex = startIndex + segment.length;

    indices.push([startIndex, endIndex]);
  });

  return indices;
};

/**
 * Extracts the dynamic data from the provided customId
 * @param itemId The id to extract the data from
 * @param route The routeId to get the keys from
 */
const getPathData = (
  itemId: string,
  route: string
): { [slug: string]: string } => {
  const getCleanData = (data: string[]): string[] =>
    data.map(str => str.replace(/\[/g, '').replace(/\]/g, ''));

  const itemDataArray = getCleanData(itemId.match(EXTRACTION_REGEX) ?? []);
  const routeDataArray = getUnmatchingData(itemId, route);

  const pathDataArray = itemDataArray
    .map((key, index) => {
      const data = routeDataArray[index];
      if (!data) return null;

      return { [key]: data };
    })
    .filter(Boolean);

  // Forcing types because TypeScript still thinks null values exist after Boolean filter
  const pathData = pathDataArray as { [slug: string]: string }[];
  return pathData.reduce((a, b) => ({ ...a, ...b }), {});
};

/**
 * Returns the ids where the content in [] is replaced with [placeholder] to make filtering easier
 * @param itemId The id to update
 */
const getMatchingId = (
  itemId: string,
  route: string
): { itemId: string; route: string } => {
  const matchingItemId = itemId.replace(EXTRACTION_REGEX, '[placeholder]');
  let matchingRouteId = route;

  // Replaces the values with the placeholder item
  getUnmatchingDataIndices(itemId, route).forEach(indices => {
    matchingRouteId = `${route.substring(
      0,
      indices[0]
    )}[placeholder]${route.substring(indices[1])}`;
  });

  return { itemId: matchingItemId, route: matchingRouteId };
};

/**
 * @param collection The collection of registered modals and buttons
 * @param route The custom id of the button or modal. It can include dynamic parts. e.g. `support-close-20392` which would trigger the button with the id `support-close-[ticketId]`
 */
const dynamicCustomIdFinder = (
  collection: Collection<string, Modal | Button | StringSelectMenu>,
  route: string
): [Modal | Button | StringSelectMenu | null, { [slug: string]: string }?] => {
  const exactMatch = collection.get(route);
  if (exactMatch) return [exactMatch];

  const returnItem = collection.find(item => {
    const itemId = item.customId;
    const matchingIds = getMatchingId(itemId, route);
    return matchingIds.itemId === matchingIds.route;
  });
  if (!returnItem) return [null, undefined];

  const pathData = getPathData(returnItem.customId, route);
  return [returnItem, pathData];
};

export default dynamicCustomIdFinder;
