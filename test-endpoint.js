async function testGraphQL() {
  try {
    console.log("Testing GET /api/graphql...");
    const resGet = await fetch("http://localhost:3000/api/graphql");
    console.log(`GET Status: ${resGet.status}`);

    console.log("Testing POST /api/graphql...");
    const resPost = await fetch("http://localhost:3000/api/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: "{ __typename }",
      }),
    });
    console.log(`POST Status: ${resPost.status}`);
    const text = await resPost.text();
    console.log(`Response: ${text.substring(0, 100)}...`);
  } catch (err) {
    console.error("Test failed:", err);
  }
}

testGraphQL();
