import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/log")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Hello "/_authenticated/log"!</div>;
}
