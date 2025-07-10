"use client";
import { useQuery, useMutation, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { hc, type InferResponseType, type InferRequestType, type RestApiType } from "@cronicorn/rest-api";

const queryClient = new QueryClient();
const {
	api: { hono: restApi },
} = hc<RestApiType>("");

export default function TestPage() {
	return (
		<QueryClientProvider client={queryClient}>
			<Todos />
		</QueryClientProvider>
	);
}

const Todos = () => {
	const query = useQuery({
		queryKey: ["todos"],
		queryFn: async () => {
			const res = await restApi.todo.$get();
			return await res.json();
		},
	});

	const $post = restApi.todo.$post;

	const mutation = useMutation<InferResponseType<typeof $post>, Error, InferRequestType<typeof $post>["form"]>({
		mutationFn: async (todo) => {
			const res = await $post({
				form: todo,
			});
			return await res.json();
		},
		onSuccess: async () => {
			queryClient.invalidateQueries({ queryKey: ["todos"] });
		},
		onError: (error) => {
			console.log(error);
		},
	});

	return (
		<div>
			<button
				type="button"
				onClick={() => {
					mutation.mutate({
						id: Date.now().toString(),
						title: "Write code",
					});
				}}
			>
				Add Todo
			</button>

			<ul>
				{query.data?.todos.map((todo) => (
					<li key={todo.id}>{todo.title}</li>
				))}
			</ul>
		</div>
	);
};
