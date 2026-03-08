import { createBrowserRouter } from "react-router";
import { Root } from "./root";
import { HomePage } from "./pages/Home";
import { ListingsPage } from "./pages/Listing";
import { ListingDetailPage } from "./pages/ListingDetail";
import { RoommatesPage } from "./pages/Roommates";
import { PostListingPage } from "./pages/PostListing";
import { GreenhousePage } from "./pages/Greenhouse";
import { GreenhousePreviewPage } from "./pages/GreenhousePreview";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: HomePage },
      { path: "listings", Component: ListingsPage },
      { path: "listings/:id", Component: ListingDetailPage },
      { path: "roommates", Component: RoommatesPage },
      { path: "post-listing", Component: PostListingPage },
      { path: "greenhouse", Component: GreenhousePage },
      { path: "greenhouse/preview", Component: GreenhousePreviewPage },
    ],
  },
]);
