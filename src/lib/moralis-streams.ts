import Moralis from "moralis";

export async function addAddressToMoralisStream(address: string) {
  try {
    const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
    if (!MORALIS_API_KEY) {
      console.warn("MORALIS_API_KEY is missing, cannot add address to stream.");
      return false;
    }

    if (!Moralis.Core.isStarted) {
      await Moralis.start({
        apiKey: MORALIS_API_KEY,
      });
    }

    // Get the existing stream ID for USDT deposits
    const streams = await Moralis.Streams.getAll({
      limit: 100,
    });

    const stream = streams.raw.result.find(
      (s: any) => s.tag === "usdt-deposits",
    );
    if (!stream) {
      console.error("Moralis Stream 'usdt-deposits' not found.");
      return false;
    }

    await Moralis.Streams.addAddress({
      id: stream.id,
      address,
    });

    console.log(
      `✅ Successfully added ${address} to Moralis Stream (ID: ${stream.id})`,
    );
    return true;
  } catch (error) {
    console.error("❌ Failed to add address to Moralis Stream:", error);
    return false;
  }
}
