
/************************************************************************

SERVER MESSAGES

************************************************************************/

function sendSpawnMessage(object){
    const response = 
       {
          type: "spawn",
          uid: object.uid,
          lockid: -1,
          state: {
             position: object.position,
             orientation: object.orientation,
          }
       };
 
    MR.syncClient.send(response);
 }
 