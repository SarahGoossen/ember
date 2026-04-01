"use client";

import dynamic from "next/dynamic";

const EmberApp = dynamic(() => import("./ui/ember-app"), {
  ssr: false,
});

export default function Home() {
  return <EmberApp />;
}
