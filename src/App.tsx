import { Button } from "@/components/ui/button";

import { dataRoomService } from "@/services/DataRoomService";

function App() {
  return (
    <Button onClick={() => dataRoomService.initializeDataRoom()}>
      Click me
    </Button>
  );
}

export default App;
