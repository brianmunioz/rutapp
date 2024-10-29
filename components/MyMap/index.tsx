import { View, ActivityIndicator, Linking, Text } from "react-native";
import React, { Fragment, useEffect, useState } from "react";
import { ExpoLeaflet, MapLayer, MapMarker } from "expo-leaflet";
import * as Location from 'expo-location';
import { useSQLiteContext } from "expo-sqlite";
import { Button, Icon, Snackbar } from "react-native-paper";
import CrearContacto from "../Acciones/CrearContacto";
import ListEditar from "../lists/ListEditar";
import IcontactosSQL from "@/interfaces/IContactosSQL";
import IRepartosSQL from "@/interfaces/IRepartosSQL";
import CrearReparto from "../Acciones/CrearReparto";
import AsyncStorage from '@react-native-async-storage/async-storage';
import ListEditarReparto from "../lists/ListEditarReparto";
const mapLayer: MapLayer = {
  baseLayerName: "OpenStreetMap",
  baseLayerIsChecked: true,
  layerType: "TileLayer",
  baseLayer: true,
  url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution:
    "OpenStreetMap contributors",
};
interface ILocation {
  lat: number,
  lng: number
}

export default function MyMap() {

  const [boolLocation, setBoolLocation] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(3);
  const [ownPosition, setOwnPosition] = useState<null | ILocation>(null)
  const [repartoBool, setRepartoBool] = useState(false);
  const [accionUsuario, setAccionUsuario] = useState<string | null>(null)
  const [modalVisible, setModalVisible] = useState(false);
  const [markerTel, setMarkerTel] = useState({ id: 0, show: false, tel: 0 })
  const [dataMarkers, setDataMarkers] = useState<MapMarker[]>([])
  const [contactosArr, setContactosArr] = useState<IcontactosSQL[]>([])
  const [repartosArr, setRepartosArr] = useState<IRepartosSQL[]>([])
  const [repartoConContacto, setRepartoConContacto] = useState<boolean | null>(null);
  const [editar, setEditar] = useState(false);
  const [mensajeSnack, setMensajeSnack] = useState({ bool: false, texto: "" });
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState<MapMarker[]>([]);
  const [followMyLocation,setFollowMyLocation] = useState<boolean>(true);
  const [modoContacto, setModoContacto] = useState(true);
  const initPosWithoutLocation: ILocation = modoContacto ? contactosArr.length > 0 ?
    { lat: contactosArr[contactosArr.length - 1].lat, lng: contactosArr[contactosArr.length - 1].lng } : { lat: -35.103034508838604, lng: -59.50661499922906 }
    : repartosArr.length > 0 ? { lat: repartosArr[repartosArr.length - 1].lat, lng: repartosArr[repartosArr.length - 1].lng } : { lat: -35.103034508838604, lng: -59.50661499922906 }

  const [mapCenterPos, setMapCenterPos] = useState<ILocation>(initPosWithoutLocation);
  const [actualPos, setActualPos] = useState<ILocation>(initPosWithoutLocation);



  const defaultZoom = ownPosition || repartosArr.length > 0 || contactosArr.length > 0 ? 18 : 3;
  const getRepartiendo = async (): Promise<boolean> => {
    const value = await AsyncStorage.getItem('repartiendo');
    return value == 'true' ?true : false;
  };
 
  useEffect(()=>{
    if(!editar){
      if(modoContacto){
        pedircontactos();
      }else{
        pedirRepartos();
      }
    }
  },[editar])
  const getSingleLocationAsync = async () => {
    try {
      // Solicita permiso de ubicación
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permiso de ubicación denegado');
        return null; // Retorna null si el permiso fue denegado
      }
  
      // Obtén la ubicación actual solo una vez
      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      return {
        lat: coords.latitude,
        lng: coords.longitude,
      };
    } catch (error) {
      console.error("Error al obtener la ubicación única: ", error);
      return null;
    }
  };

  const db = useSQLiteContext();
  const verUbicacionContacto = (lat: number, lng: number) => {
    setBoolLocation(true);
    setMapCenterPos({ lat, lng })
    setEditar(false)
    setAccionUsuario(null)

    setBoolLocation(false);

  }

  async function salirDelReparto(){
    await AsyncStorage.setItem('repartiendo', 'false');

   }
  const eliminarContacto = async (e: string) => {
    await db.runAsync('DELETE FROM contactos WHERE id = $id', { $id: e }); // Binding named parameters from object
    pedircontactos();
  }
  const eliminarReparto = async (e: string) => {
    await db.runAsync('DELETE FROM repartos WHERE id = $id', { $id: e }); // Binding named parameters from object
    const idsAsync = await AsyncStorage.getItem('ordenrepartos');
    let ids: number[] = idsAsync && idsAsync !== null ? JSON.parse(idsAsync) : [];
    const nuevosIds = repartosArr.length > 1 ? ids.filter(z => z != parseInt(e)):[]; 
    await AsyncStorage.setItem('ordenrepartos', JSON.stringify(nuevosIds));
    pedirRepartos();
  }
  const getLocationAsync = async () => {
  const subscription = await Location.watchPositionAsync(
  {
    accuracy: Location.Accuracy.High,
    timeInterval: 5000, // Tiempo entre actualizaciones en milisegundos
    distanceInterval: 1, // Distancia mínima en metros para una nueva actualización
  },
  (newLocation) => {
    const { latitude, longitude } = newLocation.coords;
    setOwnPosition({
      lat: latitude,
      lng: longitude,
    });
    

  })
  }
  useEffect(()=>{
    if(!ownPosition || ownPosition == null) {
      
      getSingleLocationAsync().then(e=>
      {
        if(e != null){
          setOwnPosition(e);
          setMapCenterPos(e);
          setFollowMyLocation(true)
        }

      }

      );
    };

    if(followMyLocation != false && ownPosition) {
      
      setMapCenterPos({
        lat: ownPosition.lat,
        lng: ownPosition.lng,
      });
     
      setZoom(17)
    }
  },[followMyLocation])

  const pedircontactos = async () => {

    const contactossql: IcontactosSQL[] = await db.getAllAsync("SELECT * FROM contactos");
    setContactosArr(contactossql)
    const nuevoscontactos: MapMarker[] = contactossql.map((e) => {
      return {
        id: e.id.toString(),
        position: { lat: e.lat, lng: e?.lng },
        icon: `
        <div 
          style="position: relative; cursor: pointer;" 
          onclick="
            const tooltip = this.querySelector('.tooltip-${e.id}');
            const isVisible = tooltip.style.display === 'block';
      
            // Ajusta la opacidad de todos los otros pins
            document.querySelectorAll('.map-pin').forEach(pin => {
              pin.style.opacity = isVisible ? '1' : '0.2'; // Reduce la opacidad si el tooltip está abierto
              if (pin === this) {
                pin.style.opacity = '1'; // Asegura que el pin clickeado esté completamente visible
              }
            });
      
            // Alterna la visibilidad del tooltip
            document.querySelectorAll('.tooltip').forEach(t => t.style.display = 'none'); // Cierra otros tooltips
            tooltip.style.display = isVisible ? 'none' : 'block';  // Alterna la visibilidad del tooltip
      
            // Ajusta el z-index del pin actual
            this.style.zIndex = isVisible ? 1 : 9999;
          "
          class="map-pin"
        >
          <div style="z-index: 1; position: relative;"> 
          <svg fill=${e.tipo == "proveedor" ? 'red' : 'green'} style="width:30px;height:30px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>map-marker</title><path d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z" /></svg>
          </div>
          <p 
            class="tooltip tooltip-${e.id}" 
            style="display:none; position:absolute;font-weight:600 ;flex-wrap:wrap; width:250px ; white-space: wrap; top:15px; left:15px; border-radius: 5px; background:white; color: #3c3c3c; padding:5px; border:1px solid #ccc; z-index: 10000;" 
          >   <span style="font-weight: bold;color: #000">${e.tipo.toUpperCase()}:</span> ${e.nombre} <br/>
            <span style="font-weight: bold;color: #000">DIRECCIÓN:</span> ${e.direccion} <br/>
            <span style="font-weight: bold;color: #000">TELÉFONO:</span> ${e.telefono || "no tiene"} <br/>
            <span style="font-weight: bold;color: #000">NOTA:</span> ${e.notas || "no hay"}    
          </p>
        </div>`,
        size: [15, 15],
      }




    })

    setDataMarkers(nuevoscontactos)
  }

  const pedirRepartos = async () => {
    const idsAsync = await AsyncStorage.getItem('ordenrepartos');
    let ids: number[] = idsAsync && idsAsync !== null ? JSON.parse(idsAsync) : [];

    if (!ids) {
      await AsyncStorage.setItem('ordenrepartos', '[]');
    }
    const repartosSQL: IRepartosSQL[] = await db.getAllAsync("SELECT * FROM repartos WHERE finalizado=0");
    if (ids.length === 0 && repartosSQL.length > 0) {
      ids = repartosSQL.map(e => e.id)
      await AsyncStorage.setItem('ordenrepartos', JSON.stringify(ids))
    }
    const orderedRepartos: IRepartosSQL[] = [];
    if (ids && ids.length > 0) {
      ids.map(id => {
        const repartoEncontrado = repartosSQL.find(e => e.id === id);
        if (repartoEncontrado) orderedRepartos.push(repartoEncontrado)
      })
    }
    setRepartosArr(orderedRepartos)
    const nuevosrepartos: MapMarker[] = orderedRepartos.map((e) => {
      return {
        id: e.id.toString(),
        position: { lat: e.lat, lng: e?.lng },
        icon: `
        <div 
          style="position: relative; cursor: pointer;" 
          onclick="
            const tooltip = this.querySelector('.tooltip-${e.id}');
            const isVisible = tooltip.style.display === 'block';
      
            // Ajusta la opacidad de todos los otros pins
            document.querySelectorAll('.map-pin').forEach(pin => {
              pin.style.opacity = isVisible ? '1' : '0.2'; // Reduce la opacidad si el tooltip está abierto
              if (pin === this) {
                pin.style.opacity = '1'; // Asegura que el pin clickeado esté completamente visible
              }
            });
      
            // Alterna la visibilidad del tooltip
            document.querySelectorAll('.tooltip').forEach(t => t.style.display = 'none'); // Cierra otros tooltips
            tooltip.style.display = isVisible ? 'none' : 'block';  // Alterna la visibilidad del tooltip
      
            // Ajusta el z-index del pin actual
            this.style.zIndex = isVisible ? 1 : 9999;
          "
          class="map-pin"
        >
          <div style="z-index: 1; position: relative;"> 
          <svg fill=${e.tipo_contacto == "proveedor" ? 'red' : 'green'} style="width:30px;height:30px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>map-marker</title><path d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z" /></svg>
          </div>
          <p 
            class="tooltip tooltip-${e.id}" 
            style="display:none; position:absolute;font-weight:600 ;width: 250px;color:#3c3c3c; flex-wrap: wrap; white-space: wrap; top:15px; left:15px; border-radius: 5px; background:white; padding:5px; border:1px solid #ccc; z-index: 10000;" 
          >   <span style="font-weight: bold;color: #000">${e.tipo_contacto.toUpperCase()}:</span> ${e.nombre} <br/>
            <span style="font-weight: bold;color: #000">DIRECCIÓN:</span> ${e.direccion} <br/>
            <span style="font-weight: bold;color: #000">TELÉFONO:</span> ${e.telefono || "no tiene"} <br/>
            <span style="font-weight: bold;color: #000">FECHA DE CREACIÓN:</span> ${e.fecha || "no tiene"} <br/>
            <span style="font-weight: bold;color: #000">DESCRIPCIÓN:</span> ${e.descripcion || "no hay"}                
          </p>
        </div>`,
        size: [15, 15],
      }
    })
    setDataMarkers(nuevosrepartos)
   
  }
  useEffect(() => {
    if(!ownPosition || ownPosition == null){
      getSingleLocationAsync().then(e=>
        {
          if(e != null){
            setOwnPosition(e);
            setMapCenterPos(e);
            setZoom(17);
            setFollowMyLocation(true)
          }
  
        }
  
        );
    };
    setAccionUsuario(null);
    setUbicacionSeleccionada([]);
    const checkRepartiendo = async () => {
      const isRepartiendo = await getRepartiendo();
      if (isRepartiendo === true) {
        setAccionUsuario('repartiendo');
        setModoContacto(false)
      }
    };
    checkRepartiendo();
    if (modoContacto) {
      pedircontactos()
    } else {
      pedirRepartos()
    }
    if (!ownPosition) {
      setMapCenterPos(initPosWithoutLocation);
    }
    getLocationAsync().catch((error) => {
      console.error(error)
    })
    
  }, [modoContacto])
  const markers: MapMarker[] = [{
    id: "ubicacion",
    position: !ownPosition ? { lat: -38.72707, lng: -62.27592 } : ownPosition,
    icon: '<svg class="map-pin"style="width: 15px;height:15px;border-radius: 50%; padding: 3px; background-color: rgb(255, 132, 132); box-shadow: 0 0 5px rgba(255, 132, 132, 0.9);"xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>crosshairs-gps</title><path d="M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M3.05,13H1V11H3.05C3.5,6.83 6.83,3.5 11,3.05V1H13V3.05C17.17,3.5 20.5,6.83 20.95,11H23V13H20.95C20.5,17.17 17.17,20.5 13,20.95V23H11V20.95C6.83,20.5 3.5,17.17 3.05,13M12,5A7,7 0 0,0 5,12A7,7 0 0,0 12,19A7,7 0 0,0 19,12A7,7 0 0,0 12,5Z" /></svg>',
    size: [12, 12],
  }
  ];
  const cambiarDeModo = () => {
     salirDelReparto();      
    setEditar(false);
    setUbicacionSeleccionada([]);
    setModalVisible(false);
    setAccionUsuario(null);
    setMarkerTel({ id: 0, show: false, tel: 0 });
    setModoContacto(!modoContacto)
  }
  const resetTodo = () => {
    if (modoContacto) {
      pedircontactos();
    } else {
      setRepartoConContacto(null)
      pedirRepartos();
    }
    setUbicacionSeleccionada([]);
    setModalVisible(false);
    setAccionUsuario(null);
    setMarkerTel({ id: 0, show: false, tel: 0 });
  }
  useEffect(() => {
    if (dataMarkers.length > 0 && !modoContacto) {
      setMapCenterPos({ lat: repartosArr[0].lat, lng: repartosArr[0].lng });
      setZoom(18)
    }

  }, [repartoBool])

  return (
    <View style={{ flex: 1, width: "100%", justifyContent: 'center' }}>
      <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", width: "100%", height: 40 }}>
        {accionUsuario != 'repartiendo' ? <Text style={{ width: "100%", color: "white", textAlign: "center", letterSpacing: 3, justifyContent: "center", textTransform: "uppercase" }}> <Icon source={modoContacto ? "account-box" : "truck-fast-outline"} size={15} color="white"></Icon>{modoContacto ? "contactos" : "repartos"}{accionUsuario ? ' - ' + accionUsuario : ""}</Text>
          :
          <Text style={{ width: "100%",flexWrap: "wrap", color: "white", textAlign: "center", letterSpacing: 3, justifyContent: "center", textTransform: "uppercase" }}> <Icon source={"truck-fast-outline"} size={15} color="white"></Icon>{repartosArr.length > 0 ? repartosArr[0].nombre + ' -' : 'Cargando'} {repartosArr.length > 0 ? repartosArr[0].direccion : '...'}</Text>

        }
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", height: 50 }}>
        {
          accionUsuario != "repartiendo" &&
          <Button contentStyle={{ height: "100%" }} buttonColor="#fdfd96" style={{ flex: 1, borderRadius: 0 }} onPress={() => cambiarDeModo()} mode="contained" ><Icon size={20} source={"sync"} color="black" /></Button>

        }
        <Button contentStyle={{ height: "100%" }} buttonColor="rgb(255, 132, 132)" style={{ flex: 1, borderRadius: 0 }} mode="contained" onPress={
          () => {
            if (ownPosition) {
              setFollowMyLocation(true)
              setMapCenterPos(actualPos);
              setMarkerTel({ id: 0, show: false, tel: 0 })
              if (accionUsuario != 'repartiendo') setAccionUsuario(null);
              setBoolLocation(true);
            }
          }} ><Icon size={20} source={"crosshairs-gps"} color="black" /></Button>
        {!modoContacto && accionUsuario == "repartiendo" &&
          <Button contentStyle={{ height: "100%", flexDirection: "column" }} buttonColor="#FF9D3D" style={{ flex: 1, borderRadius: 0 }} mode="contained"
            onPress={() => {
              setMapCenterPos(actualPos)
              setRepartoBool(!repartoBool)
            }}><Icon size={20} source={"map-marker"} color="black" /></Button>
        }
        {
          accionUsuario != 'repartiendo' &&
          <Button contentStyle={{ height: "100%" }} buttonColor="#77dd77" style={{ flex: 1, borderRadius: 0 }} mode="contained" onPress={() => {
            if (modoContacto) {
              setMarkerTel({ id: 0, show: false, tel: 0 })
              setEditar(true)
              setAccionUsuario('editar');
            }else{
              setEditar(true)
              setAccionUsuario('editar');
            }


          }}><Icon size={20} source={"playlist-edit"} color="black" /></Button>
        }

        {
          accionUsuario != 'repartiendo' &&
          <Button onPress={() => {
            setEditar(false);
            setAccionUsuario(null);
            setMarkerTel({ id: 0, show: false, tel: 0 })
            setModalVisible(false)
            setRepartoConContacto(null)
            setUbicacionSeleccionada([]);
          }} contentStyle={{ height: "100%" }} buttonColor="#e1e3e1" style={{ flex: 1, borderRadius: 0 }} mode="contained" ><Icon size={20} source={"earth-box"} color="black" /></Button>

        }

        {
          accionUsuario != 'repartiendo' &&
          <Button textColor="black" contentStyle={{ height: 50 }} style={{ flex: 1, backgroundColor: "#FF6961", height: 50, borderRadius: 0, width: 70, justifyContent: "center" }} mode="contained" onPress={() => {
            setMarkerTel({ id: 0, show: false, tel: 0 })
            setAccionUsuario('crear');
            if (!modoContacto) setModalVisible(true)
            setEditar(false)

          }}
          ><Icon size={20} source={"map-marker-plus-outline"}></Icon></Button>
        }
        {
          accionUsuario === "repartiendo" && repartosArr.length > 0 &&
          <Fragment>
            <Button mode="contained" disabled={repartosArr[0].telefono == null} contentStyle={{ height: "100%" }} style={{ flex: 1, borderRadius: 0, backgroundColor: repartosArr[0].telefono == null ? "#dcdcdc" : "#347928" }} onPress={() => repartosArr[0].telefono != null && Linking.openURL(`http://api.whatsapp.com/send?phone=${repartosArr[0].telefono}`)}><Icon size={20} source={"whatsapp"} color={repartosArr[0].telefono != null ? 'white' : "grey"} /> </Button>
            <Button mode="elevated" disabled={!repartosArr[0].telefono == null} contentStyle={{ height: "100%" }} style={{ flex: 1, borderRadius: 0, backgroundColor: repartosArr[0].telefono == null ? "#dcdcdc" : "#10375C", borderLeftWidth: 1, borderLeftColor: "#737373" }} onPress={() => repartosArr[0].telefono != null && Linking.openURL(`tel:+${repartosArr[0].telefono}`)}> <Icon size={20} source={"phone"} color={repartosArr[0].telefono != null ? 'white' : "grey"} />  </Button>
          </Fragment>
        }


      </View>
      {editar && !modoContacto && 
              <ListEditarReparto pedirContactos={pedirRepartos} datos={repartosArr} verUbicacion={verUbicacionContacto} eliminar={(e) => eliminarReparto(e)} />

      }
      {editar && modoContacto &&
        <ListEditar pedirContactos={pedircontactos} datos={contactosArr} verUbicacion={verUbicacionContacto} eliminar={(e) => eliminarContacto(e)} />
      }
      {
        !modalVisible && !editar &&
        <ExpoLeaflet
          mapLayers={[mapLayer]}
          mapMarkers={accionUsuario === "crear" ? [...ubicacionSeleccionada, ...dataMarkers] : ownPosition ?
            accionUsuario === 'repartiendo' ?
              [markers[0], dataMarkers[0]]
              : [markers[0], ...dataMarkers]
            : accionUsuario === 'repartiendo' && repartosArr.length > 0 ?
              [dataMarkers[0]]
              : dataMarkers.length > 0 ? dataMarkers : []}
          mapCenterPosition={followMyLocation || repartoBool ? mapCenterPos : mapCenterPos}
          maxZoom={18}
          zoom={followMyLocation ? zoom : defaultZoom}
          loadingIndicator={() => <ActivityIndicator style={{ height: "100%" }} animating={true} size={"large"} color={"black"} />}
          onMessage={(message) => {
            if(message.tag === 'onMove' && followMyLocation) setFollowMyLocation(false)
            if (message.tag == "onMoveEnd") {
              setZoom(message.zoom)
              setActualPos(message.mapCenter)
            }

            if (message.tag === 'onMapClicked' && (accionUsuario == "crear")) {
              const newMarker: MapMarker = {
                id: "ubicacion-seleccionada",
                position: { lat: message.location.lat, lng: message.location.lng },
                icon: `<svg style="width:30px;height:30px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>map-marker</title><path d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z" /></svg>`,
                size: [15, 15],
              }
              setUbicacionSeleccionada([newMarker]);
            } else if (message.tag == "onMapMarkerClicked" && message.mapMarkerId !== "ubicacion") {
              const idMarker = parseInt(message.mapMarkerId);
              if (idMarker !== markerTel.id) {
                const findMarker: IcontactosSQL[] = contactosArr.filter(e => e.id === idMarker);
                setMarkerTel({ id: idMarker, show: true, tel: findMarker[0]?.telefono || 0 })
              } else {
                setMarkerTel({ id: markerTel.id, show: !markerTel.show, tel: markerTel.tel })

              }

            }
          }}
        />
      }

      {
        modoContacto && accionUsuario === "crear" && ubicacionSeleccionada && modalVisible &&
        <CrearContacto resetTodo={resetTodo} ubicacionSeleccionada={ubicacionSeleccionada} setModalVisible={setModalVisible} />
      }
      {
        !modoContacto && accionUsuario === "crear" && ubicacionSeleccionada && modalVisible &&
        <CrearReparto contactos={contactosArr} repartoConContacto={repartoConContacto} resetTodo={resetTodo} ubicacionSeleccionada={ubicacionSeleccionada} setModalVisible={setModalVisible} />
      }
      {
        !modoContacto && accionUsuario == null &&
        <View style={{ position: "absolute", bottom: 0, flexDirection: "row", justifyContent: "center", height: 50 }}>
          <Button mode="contained" contentStyle={{ height: "100%" }} style={{ width: "100%", borderRadius: 0 }} onPress={() => {
            if (repartosArr.length > 0 && dataMarkers.length > 0) {
              setAccionUsuario('repartiendo');
              AsyncStorage.setItem('repartiendo', 'true')
            } else {

              setMensajeSnack({ bool: true, texto: "Debe crear repartos para poder empezar" })

            }
          }}>Empezar</Button>
        </View>
      }
      {
        accionUsuario === "repartiendo" &&
        <View style={{ position: "absolute", bottom: 0, flexDirection: "row", justifyContent: "center", height: 50 }}>
          <Button mode="contained" icon="motion-pause" contentStyle={{ height: "100%" }} style={{ width: "33.3%", borderRadius: 0 }} buttonColor="#C62E2E" textColor="white" onPress={() => {
            
            salirDelReparto();
            setAccionUsuario(null);
          }}>DETENER</Button>
          
          <Button mode="elevated" icon={'page-next-outline'} contentStyle={{ height: "100%" }} style={{ width: "33.3%", borderRadius: 0 }} onPress={() => {
            let arreglo = [...dataMarkers];

            arreglo.push(arreglo.splice(0, 1)[0]);
            async function reordenarArreglo() {
              const idsAsync = await AsyncStorage.getItem('ordenrepartos');
              let ids: number[] = idsAsync && idsAsync !== null ? JSON.parse(idsAsync) : [];
              ids.push(ids.splice(0, 1)[0]);
              await AsyncStorage.setItem('ordenrepartos', JSON.stringify(ids))
              pedirRepartos()

            }
            reordenarArreglo()
            setDataMarkers(arreglo)

          }}>POSTERGAR</Button>
          <Button mode="contained" icon={repartosArr.length ===1 ?"map-marker-check" :"chevron-right"} contentStyle={{ height: "100%" }} style={{ width: "33.3%", borderRadius: 0 }} onPress={() => {
            async function avanzarReparto() {               
              await db.runAsync('UPDATE repartos SET finalizado = 1 WHERE id = ?', repartosArr[0].id);
              const idsAsync = await AsyncStorage.getItem('ordenrepartos');
              let ids: number[] = idsAsync && idsAsync !== null ? JSON.parse(idsAsync) : [];
              const nuevosIds = repartosArr.length > 1 ? ids.filter(e => e != repartosArr[0].id):[]; 
              await AsyncStorage.setItem('ordenrepartos', JSON.stringify(nuevosIds));
            }
            avanzarReparto();
            pedirRepartos();
            

            if (repartosArr.length <=1) {
              setRepartosArr([]);
              salirDelReparto();
              setAccionUsuario(null)
            }
          }}
          
          >{repartosArr.length === 1 ? "FINALIZAR":"AVANZAR"}</Button>
        </View>
      }

      {accionUsuario === null && modoContacto && !editar &&
        <View style={{ position: "absolute", bottom: 0, flexDirection: "row", justifyContent: "center", height: 50 }}>
          <Button mode="contained" disabled={!markerTel.show} contentStyle={{ height: "100%", borderRightWidth: 1, borderRightColor: "#C0C0C0" }} style={{ width: "50%", borderRadius: 0, backgroundColor: !markerTel.show ? "#dcdcdc" : "#051b37" }} icon={"whatsapp"} onPress={() => markerTel.show && markerTel.tel !== 0 && Linking.openURL(`http://api.whatsapp.com/send?phone=${markerTel.tel}`)}>{markerTel.tel === 0 && markerTel.show ? "WHATSAPP (no tiene)" : "WHATSAPP"}</Button>
          <Button mode="contained" disabled={!markerTel.show} contentStyle={{ height: "100%" }} style={{ width: "50%", borderRadius: 0, backgroundColor: !markerTel.show ? "#dcdcdc" : "#051b37", borderLeftWidth: 1, borderLeftColor: "#737373" }} icon="phone" onPress={() => markerTel.show && markerTel.tel !== 0 && Linking.openURL(`tel:+${markerTel.tel}`)}>{markerTel.tel === 0 && markerTel.show ? "LLAMAR (no tiene número)" : "LLAMAR"}</Button>
        </View>}
      {accionUsuario === "crear" && !modalVisible && !editar &&
        <View style={{ position: "absolute", bottom: 0, flexDirection: "row", justifyContent: "center", height: 50 }}>
          <Button mode="elevated" contentStyle={{ height: "100%" }} style={{ width: "50%", borderRadius: 0 }} textColor="#C5705D" onPress={() => {
            if (modoContacto) {
              resetTodo();
              setEditar(false);
            }
            if (!modoContacto && accionUsuario === "crear") {
              setRepartoConContacto(null);
              setModalVisible(true);
            }
          }}>cancelar</Button>
          <Button mode="contained" contentStyle={{ height: "100%" }} style={{ backgroundColor: ubicacionSeleccionada.length > 0 ? "#386b38" : "#dcdcdc", width: "50%", borderRadius: 0 }} onPress={() => {
            if (ubicacionSeleccionada.length > 0) {
              setRepartoConContacto(false)
              setModalVisible(true);
            } else {
              setMensajeSnack({ bool: true, texto: "Debe seleccionar ubicación para poder seguir" })
            }
          }}>LISTO</Button>
        </View>
      }
      <Snackbar icon="alert" visible={mensajeSnack.bool} onDismiss={() => setMensajeSnack({ ...mensajeSnack, bool: false })}  >{mensajeSnack.texto}</Snackbar>
    </View>
  );
}