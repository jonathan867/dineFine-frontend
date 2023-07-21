import { useMemo, useState, useEffect } from "react";
import { GoogleMap, useLoadScript } from "@react-google-maps/api";

import 'bootstrap/dist/css/bootstrap.min.css'; // formats and styling
import "./App.css"
import { Form, Input, Button } from 'antd';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

import { QuestionOutlined, LinkOutlined } from '@ant-design/icons'; // icons and assets
import Logo from './assets/logo.png';
import Title from './assets/title.png';
import RestaurantMap from './assets/restaurantMap.png';
import MySQLIcon from './assets/MySQL.png';
import ExpressIcon from './assets/ExpressJS.png';
import ReactIcon from './assets/React.png';
import BoostrapIcon from './assets/Bootstrap.png';
import NoImage from './assets/NoImage.png';
import initialRestaurantImg from './assets/InitialRestaurant.png';

import restaurants from "./data/restaurants";
import initialRestaurant from "./data/initialRestaurant";

function addMarkers(map) {
    restaurants.map(([name, address, location, price, cuisine, lng, lat, phoneNumber, url, websiteUrl, award, facilitiesAndServices]) => {
        const marker = new window.google.maps.Marker({ position: { lat, lng }, map });

        const infoWindow = new window.google.maps.InfoWindow();
        infoWindow.setContent(`
            <div class="info-window" style="width: 170px; height: 240px;">
                <h4>${name}</h4>
                <div style="margin-top: 25px; display: flex; flex-direction: row;">
                    <p style="font-weight: bold; font-size: 14px; margin-bottom: 3px;"> Award: </p>
                    <p style="font-size: 14px;"> &nbsp;&nbsp;${award} </p>
                </div>
                <div style="display: flex; flex-direction: row;">
                    <p style="font-weight: bold; font-size: 14px; margin-bottom: 3px;"> Price: </p>
                    <p style="font-size: 14px;"> &nbsp;&nbsp;${price} </p>
                </div>
                <p style="font-weight: bold; font-size: 14px; margin-bottom: 3px;"> Address: </p>
                <p style="font-size: 14px;"> ${address} </p>
                <div style="display: flex; flex-direction: row;">
                    <p style="font-weight: bold; font-size: 14px; margin-bottom: 3px;"> Phone: </p>
                    <p style="font-size: 14px;"> &nbsp;&nbsp;${phoneNumber} </p>
                </div>
                <div style="display: flex; flex-direction: row;">
                    <p style="font-weight: bold; font-size: 14px; margin-bottom: 3px;"> City: </p>
                    <p style="font-size: 14px;"> &nbsp;&nbsp;${location} </p>
                </div>
                <div style="display: flex; flex-direction: row;">
                    <p style="font-weight: bold; font-size: 14px; margin-bottom: 3px;"> Cuisine: </p>
                    <p style="font-size: 14px;"> &nbsp;&nbsp;${cuisine} </p>
                </div>
                <p style="font-weight: bold; font-size: 14px; margin-bottom: 3px;"> Facilities and Services: </p>
                <p style="font-size: 14px;"> ${facilitiesAndServices} </p>
            </div>
        `);

        marker.addListener("click", () => {
            infoWindow.open(map, marker);
        });

        return marker;
    });
}

function App() {
    // Map Constants
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.REACT_APP_MAP_API_KEY
    }) // make another isLoaded?

    const center = useMemo(() => ({ lat: 35, lng: 0 }), []);
    const navCenter = useMemo(() => ({ lat: 43.65607, lng: -79.38647 }), []);

    const [navMapPoint, setNavMapPoint] = useState({ lat: 43.65607, lng: -79.38647 });

    const moveNavMarker = (map) => {
        const navMarker = new window.google.maps.Marker({ position: navMapPoint, map });
        map.addListener('click', (event) => {
            const clickedPosition = {
                lat: event.latLng.lat(),
                lng: event.latLng.lng()
            };
            setNavMapPoint(clickedPosition);
            navMarker.setPosition(clickedPosition);
        });
    }

    // Info modal
    const [modalOpen, setModalOpen] = useState(false);
    const toggleModal = () => {
        setModalOpen(!modalOpen);
    };

    // Form fields
    const [fields, setFields] = useState([{ name: ['lat'], value: 43.65607 }, { name: ['lng'], value: -79.38647 }]);
    const [form] = Form.useForm();

    // Closest restaurant api consts
    const [closestData, setClosestData] = useState(initialRestaurant);

    const handleMarkerSubmit = () => {
        FindClosest(navMapPoint.lat, navMapPoint.lng);
    }
    const handleCoordSubmit = () => {
        form.validateFields().then(values => {
            const latitude = values.lat;
            const longitude = values.lng;
            const isValidLatitude = /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)$/.test(latitude); // validate correct lng lat format
            const isValidLongitude = /^[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/.test(longitude);

            if (isValidLatitude && isValidLongitude) {
                FindClosest(latitude, longitude);
            }
        })
    };

    const [RestaurantPhotoUrl, setPhotoUrl] = useState(initialRestaurantImg);
    const [PhotoCredits, setPhotoCredits] = useState("https://maps.google.com/maps/contrib/106921389537611902237");

    const FindClosest = async (lat, lng) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_LINK}/find-closest/${lat}/${lng}`);
            const restaurantsJsonData = await response.json();

            setClosestData(restaurantsJsonData);

            const name = encodeURIComponent(restaurantsJsonData[0].Name);
            const address = encodeURIComponent(restaurantsJsonData[0].Address);
            const photoDataResponse = await fetch(`${process.env.REACT_APP_BACKEND_LINK}/get-image-url/${name}/${address}`);
            const photoData = await photoDataResponse.json();

            const photoRef = photoData?.photoRef;
            if (photoRef) {
                setPhotoUrl(`https://maps.googleapis.com/maps/api/place/photo?maxwidth=300&photo_reference=${photoRef}&key=${process.env.REACT_APP_MAP_API_KEY}`);
            } else {
                setPhotoUrl(NoImage); // Handle the scenario when photoRef is not available
            }

            const htmlAttributions = photoData?.htmlAttributions;
            if (htmlAttributions && htmlAttributions.length > 0) {
                const linkString = htmlAttributions[0].match(/"(.*?)"/)[1];
                setPhotoCredits(linkString);
            } else {
                setPhotoCredits("");
            }

        } catch (error) {
            console.error('An error occurred:', error);
        }
    };
    useEffect(() => {
        const updateImageSource = () => {
            const img = document.getElementById('restaurant-photo');
            if (img) {
                img.src = RestaurantPhotoUrl;
            }
            if (PhotoCredits) {
                const link = document.getElementById('photo-credits-link');
                if (link) {
                    link.href = PhotoCredits;
                }
            }
        };

        updateImageSource(); // Call the updateImageSource function when RestaurantPhotoUrl changes
    }, [RestaurantPhotoUrl, PhotoCredits]); // dependecies

    const addSpaceAfterComma = (str) => { // cleans up the csv string format for FacilitiesAndServices
        return str.replace(/,/g, ', ');
    }
    const stars = (award) => {
        switch (award) {
            case "1 MICHELIN Star":
                return '\u{2B50}';
            case "2 MICHELIN Stars":
                return '\u{2B50} \u{2B50}';
            case "3 MICHELIN Stars":
                return '\u{2B50} \u{2B50} \u{2B50}';
            default:
                return "";
        }
    };

    return (
        <>
            <div className='col-12 text-center mb-2 ps-2 pe-2 d-flex justify-content-between align-items-center' style={{ backgroundColor: '#E35134' }}>
                <img className='m-3' style={{ width: '60px', height: 'auto' }}
                    src={Logo}
                    alt="logo"
                />
                <img className='m-3' style={{ width: '260px', height: 'auto' }}
                    src={Title}
                    alt="site name"
                />
                <div className='m-3 d-flex justify-content-center align-items-center' style={{ width: '60px', height: '60px', borderRadius: '50px', backgroundColor: 'white', boxShadow: '4px 4px 8px rgba(0, 0, 0, 0.2)' }}>
                    <QuestionOutlined onClick={() => toggleModal()} className='ml-2 mr-3' style={{ fontSize: '45px', color: '#E35134' }} />
                </div>
            </div>

            <Modal isOpen={modalOpen} toggle={toggleModal}>
                <ModalHeader className='' toggle={toggleModal} style={{ display: 'flex', justifyContent: 'center', color: "white", backgroundColor: '#E35134' }}>
                    <div className=''> Welcome to DineFine! </div>
                </ModalHeader>
                <ModalBody>
                    <div className='text-center m-5' style={{ fontWeight: "bold", color: '#E35134' }}> Find your closest fine dining experience {'\u{1F4CD}'} </div>
                    <div className='mt-5 text-center' style={{ fontWeight: "bold", fontSize: "24px" }}> Global Awarded Restaurants Map </div>
                    <div className='d-flex justify-content-center'>
                        <img className='m-3' style={{ width: '370px', height: 'auto' }}
                            src={RestaurantMap}
                            alt="restaurant map"
                        />
                    </div>
                    <div className="me-5 ms-5 mt-2">
                        <div> • &nbsp;Click a marker to get the restaurant information </div>
                        <div style={{ display: "flex", flexDirection: "row" }}>
                            <div> •&nbsp; </div>
                            <div style={{ color: '#E35134', fontWeight: "bold" }}> &nbsp;6782&nbsp; </div>
                            <div> restaurants in database </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "row" }}>
                            <div> •&nbsp; Data last updated</div>
                            <div style={{ color: '#E35134', fontWeight: "bold" }}> &nbsp;Aug 2023 </div>
                        </div>
                        <div> • &nbsp;Enter a location with map marker or coordinates &nbsp;&nbsp;&nbsp;&nbsp;to find the nearest awarded restaurant! </div>
                    </div>
                    <div className='mt-5 mb-3 text-center' style={{ fontWeight: "bold", fontSize: "24px" }}> Powered By... </div>
                    <div className="me-5 ms-5">
                        <div className='mt-3' style={{ display: "flex", flexDirection: "row", alignItems: "flex-end" }}>
                            <div className='mb-2 me-3' style={{ fontSize: "20px" }}> Backend: </div>
                            <img className='me-3 ms-3 mb-1' style={{ width: 'auto', height: '60px' }} src={MySQLIcon} alt="mysql" />
                            <img className='me-3 ms-3' style={{ width: 'auto', height: '40px' }} src={ExpressIcon} alt="express" />
                        </div>
                    </div>
                    <div className="me-5 ms-5">
                        <div className='mt-3 mb-3' style={{ display: "flex", flexDirection: "row", alignItems: "flex-end" }}>
                            <div className='mb-1 me-2' style={{ fontSize: "20px" }}> Frontend: </div>
                            <img className='me-3 ms-3' style={{ width: 'auto', height: '40px' }} src={ReactIcon} alt="react" />
                            <img className='me-3 ms-3' style={{ width: 'auto', height: '40px' }} src={BoostrapIcon} alt="bootstrap" />
                        </div>
                        <div className='mt-3 mb-0' style={{ display: "flex", flexDirection: "row", alignItems: "flex-end" }}>
                            <div className='mb-1 me-5' style={{ fontSize: "20px" }}> APIS: </div>
                            <div className='mb-1 ps-3' style={{ fontSize: "20px" }}> Google Maps JS API&nbsp; {'\u{1F30E}'}</div>
                        </div>
                        <div className='mb-4 ms-5 ps-5' style={{ fontSize: "20px" }}> &nbsp;&nbsp; Google Place Photos API&nbsp; {'\u{1F4F7}'}</div>
                    </div>
                </ModalBody>
                <ModalFooter style={{ display: 'flex', justifyContent: 'center', color: "gray" }}> Jonathan Feng - 2023</ModalFooter>
            </Modal>

            <div className='col-10 offset-1 text-center mt-5'>
                <h2 className='text-center'> All Michelin Star/Bib Gourmand Restaurants Across the World</h2>
            </div>

            <div className='col-10 offset-1 mt-4' style={{ boxShadow: '4px 4px 8px rgba(0, 0, 0, 0.2)' }}>
                {!isLoaded ? (
                    <h1>Loading...</h1>
                ) : (
                    // map-container has NECESSARY sizing in App.css
                    <GoogleMap mapContainerClassName="map-container" center={center} zoom={1.8} onLoad={addMarkers} />
                )}
                {/* <div className='col-5 justify-content-center me-3' style={{ backgroundColor: 'pink', width: "100%", height: "70vh" }}>
                    hi
                </div> */}
            </div>

            <div className='col-10 offset-1 text-center mt-5'>
                <hr style={{ borderTop: "1px solid gray", margin: "10px 0" }} />
                <h2 className='text-center' style={{ fontWeight: "bold", color: '#E35134', marginTop: "70px", marginBottom: "50px" }}> Enter a location and find the closest awarded restaurant {'\u{1F4CD}'}</h2>
            </div>

            <div className='row col-10 offset-1 justify-content-center mt-5 mb-5' style={{ backgroundColor: '#F5F5F5' }}>
                <div className='col-6 justify-content-center ps-0 pe-4' style={{ backgroundColor: 'white' }}>
                    <div className='' style={{ boxShadow: '4px 4px 8px rgba(0, 0, 0, 0.08)' }}>
                        {!isLoaded ? (
                            <h1>Loading...</h1>
                        ) : (
                            // map-container has NECESSARY sizing in App.css
                            <GoogleMap mapContainerClassName="navMap-container" center={navCenter} zoom={6} onLoad={moveNavMarker} />
                        )}
                        {/* <div className='col-5 justify-content-center me-3' style={{ backgroundColor: 'orange', width: "100%", height: "40vh" }}>
                            hi
                        </div> */}
                    </div>
                    <div className="text-center mt-2 mb-4" style={{ fontWeight: "bold", color: '#E35134' }}> Click a point on the map to set marker location </div>
                    <div className='d-flex justify-content-center mt-2 mb-5'>
                        <Button key='submitMarker' onClick={handleMarkerSubmit} style={{ color: "white", backgroundColor: "#E35134", borderColor: "#E35134", width: "240px", height: "40px", borderRadius: '8px', boxShadow: '4px 4px 8px rgba(0, 0, 0, 0.2)' }}>
                            Find By Map Marker
                        </Button>
                    </div>
                    <div className=' justify-content-center text-gray pt-4 ps-5 pe-5 pb-4' style={{ backgroundColor: '#F5F5F5', borderRadius: '5px', boxShadow: '4px 4px 8px rgba(0, 0, 0, 0.08)' }}>
                        <Form
                            form={form}
                            fields={fields}
                            onFieldsChange={(_, newFields) => { setFields(newFields); }}
                        >
                            <Form.Item name='lat' label='Latitude'>
                                <Input style={{ width: '100%', marginBottom: '20px' }} />
                            </Form.Item>
                            <Form.Item name='lng' label='Longitude'>
                                <Input style={{ width: '100%', marginBottom: '10px' }} />
                            </Form.Item>
                        </Form>
                    </div>
                    <div className='d-flex justify-content-center mt-5'>
                        <Button key='submitCoord' onClick={handleCoordSubmit} style={{ color: "white", backgroundColor: "#E35134", borderColor: "#E35134", width: "240px", height: "40px", borderRadius: '8px', boxShadow: '4px 4px 8px rgba(0, 0, 0, 0.2)' }}>
                            Find By Coordinates
                        </Button>
                    </div>
                </div>
                <div className='col-6 p-4 justify-content-center' style={{ backgroundColor: '#F5F5F5', boxShadow: '4px 4px 8px rgba(0, 0, 0, 0.08)' }}>
                    <h3> {closestData[0].Name} </h3>
                    {/* <div className='col-5 d-flex justify-content-center mt-3 mb-2'>
                        <div >
                            <img id="restaurant-photo" src={RestaurantPhotoUrl} alt="Restaurant" style={{ height: "30vh" }} />
                        </div>
                    </div> */}
                    <div className='col-12 d-flex justify-content-center mt-3 mb-2'>
                        <img id="restaurant-photo" src={RestaurantPhotoUrl} alt="Restaurant" style={{ maxHeight: "30vh", maxWidth: "100%" }} />
                    </div>
                    <div className="mb-4" style={{ display: "flex", flexDirection: "row" }}>
                        <div style={{ fontSize: "14px", width: "120px" }}> Photo credits: </div>
                        <div className="d-flex justify-content-end mb-0 ms-auto me-5">
                            <a id="photo-credits-link" style={{ fontSize: "14px", width: 'calc(100% - 120px)' }} href={PhotoCredits} target="_blank" rel="noopener noreferrer"> <LinkOutlined /> </a>
                        </div>
                    </div>
                    <div className="mb-2" style={{ display: "flex", flexDirection: "row" }}>
                        <div style={{ fontWeight: "bold", fontSize: "14px", width: "120px" }}> Award: </div>
                        <div style={{ fontSize: "14px", width: 'calc(100% - 120px)' }}> {closestData[0].Award} &nbsp;{stars(closestData[0].Award)} </div>
                    </div>
                    <div className="mb-2" style={{ display: "flex", flexDirection: "row" }}>
                        <div style={{ fontWeight: "bold", fontSize: "14px", width: "120px" }}> Cuisine: </div>
                        <div style={{ fontSize: "14px", width: 'calc(100% - 120px)' }}> {closestData[0].Cuisine} </div>
                    </div>
                    <div className="mb-2" style={{ display: "flex", flexDirection: "row" }}>
                        <div style={{ fontWeight: "bold", fontSize: "14px", width: "120px" }}> Price: </div>
                        <div style={{ fontSize: "14px", width: 'calc(100% - 120px)' }}> {closestData[0].Price} </div>
                    </div>
                    <div className="mb-2" style={{ display: "flex", flexDirection: "row" }}>
                        <div style={{ fontWeight: "bold", fontSize: "14px", width: "120px" }}> Address: </div>
                        <div style={{ fontSize: "14px", width: 'calc(100% - 120px)' }}> {closestData[0].Address} </div>
                    </div>
                    <div className="mb-2" style={{ display: "flex", flexDirection: "row" }}>
                        <div style={{ fontWeight: "bold", fontSize: "14px", width: "120px" }}> City: </div>
                        <div style={{ fontSize: "14px", width: 'calc(100% - 120px)' }}> {closestData[0].Location} </div>
                    </div>
                    <div className="mb-2" style={{ display: "flex", flexDirection: "row" }}>
                        <div style={{ fontWeight: "bold", fontSize: "14px", width: "120px" }}> Website: </div>
                        <div className="d-flex justify-content-end mb-0 ms-auto me-5">
                            <a style={{ fontSize: "14px", width: 'calc(100% - 120px)' }} href={closestData[0].WebsiteUrl} target="_blank" rel="noopener noreferrer"> <LinkOutlined /> </a>
                        </div>
                    </div>
                    <div className="mb-4" style={{ display: "flex", flexDirection: "row" }}>
                        <div style={{ fontWeight: "bold", fontSize: "14px", width: "200px" }}> Michelin Guide URL: </div>
                        <div className="d-flex justify-content-end mb-0 ms-auto me-5">
                            <a style={{ fontSize: "14px", width: 'calc(100% - 120px)' }} href={closestData[0].Url} target="_blank" rel="noopener noreferrer"> <LinkOutlined /> </a>
                        </div>
                    </div>
                    <div style={{ fontWeight: "bold", fontSize: "14px" }}> Facilities and Services: </div>
                    <div className='mb-2' style={{ fontSize: "14px" }}> {addSpaceAfterComma(closestData[0].FacilitiesAndServices)} </div>
                    <div style={{ fontWeight: "bold", fontSize: "14px" }}> Award Description: </div>
                    <div style={{ fontSize: "14px" }}> {closestData[0].AwardDescription} </div>
                </div>
            </div>
            <div className='col-12 text-center p-3 d-flex justify-content-center align-items-center' style={{ marginTop: "120px", color: "white", backgroundColor: '#E35134' }}>
                Jonathan Feng - 2023
            </div>
        </>
    );
}

export default App;