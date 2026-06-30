
async function testGraphQL() {
  console.log("Waiting 3 seconds for Next.js to start up...");
  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    console.log("Testing POST /api/graphql with schema query...");
    const resPost = await fetch("http://localhost:3000/api/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
          query {
            __schema {
              types {
                name
              }
            }
          }
        `,
      }),
    });
    console.log(`POST Status: ${resPost.status}`);
    const json = await resPost.json();
    if (json.errors) {
      console.error("GraphQL errors found:", JSON.stringify(json.errors, null, 2));
      process.exit(1);
    } else {
      console.log("GraphQL Schema parsed successfully. Found types count:", json.data.__schema.types.length);
      console.log("First few type names:", json.data.__schema.types.slice(0, 10).map(t => t.name));
      console.log("API schema test: SUCCESS ✅");
      process.exit(0);
    }
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
}

testGraphQL();
