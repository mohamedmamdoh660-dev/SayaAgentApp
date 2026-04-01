export async function executeGraphQLBackend<T = any>(query: string, variables?: Record<string, any>) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`GraphQL HTTP error! status: ${response.status}, message: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }

    return result.data as T;
  } catch (error) {
    console.error('GraphQL Error:', error);
    throw error;
  }
} 