import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import InfiniteScroll from 'react-infinite-scroll-component';
import axios from 'axios';

import { Grid, Box, Typography, Button, MenuItem, Card } from '@material-ui/core';
import { AddOutlined } from '@material-ui/icons';

import {
    changeCreatedAssetVisibility,
    getCreatedAssets,
    getCreatedAssetsForTable,
    loadMoreCreatedItems,
    upvoteCreatedAsset,
    unUpvoteCreatedAsset,
    toFavoritesCreatedAssets,
    removeFromFavoritesCreatedAssets,
    placeABidAction,
    buyNowSuccess,
    afterMakeAnOffer,
    removeAsset,
} from 'redux/createdAsset/actions';
import { updateAssetVisibilities } from 'redux/marketplace/actions';
import { ANONYMOUS, CREATOR, PROFILE_FILTERS_CREATION, PROFILE_SORTS } from 'configs';
import LottieContainer from 'components/shared/LottieContainer';
import { AssetsFromWallet } from '.';
import FlexibleDropdownFilter from 'components/shared/dropdown/flexible-dropdown-filter';
import FlexibleDropdownSort from 'components/shared/dropdown/flexible-dropdown-sort';
import ShowStyle, { SHOW_TYPE } from 'components/shared/ShowStyle';
import SearchBox from 'components/shared/SearchBox';
import SelectAll from 'components/shared/SelectAll';
import { Logo } from 'components/shared';
import AssetCard from 'components/elements/cards/assetCard';
import AssetList from 'components/elements/list/assetList';
import BecomeCreator from './dialogs/BecomeCreator';
import RequestSent from './dialogs/RequestSent';
import useWindowDimensions from 'hooks/useWindowDimensions';

const ProfileCreated = () => {
    const dispatch = useDispatch();
    const { username } = useParams();

    const { isMobile } = useWindowDimensions();

    const [creatorDialog, setCreatorDialog] = useState(false);
    const [requestSentDialog, setRequestSentDialog] = useState(false);
    const [filters, setFilters] = useState(
        PROFILE_FILTERS_CREATION.reduce((acc, cur) => ({ ...acc, [cur.category.value]: [] }), {}),
    );
    const [sortOption, setSortOption] = useState('');
    const [showType, setShowType] = useState(SHOW_TYPE.grid);
    const [selectedAssets, setSelectedAssets] = useState([]);
    const [listViewSort, setListViewSort] = useState({ field: 'created_at', direction: 'desc' });
    const [searchKey, setSearchKey] = useState('');

    const { isLoggedIn } = useSelector((state) => state.auth);
    const { user: profileUser } = useSelector((state) => state.profile);
    const { user: authUser } = useSelector((state) => state.auth);
    const user = authUser?.username === username ? authUser : profileUser;
    const isMyProfile = authUser?.username === username;

    const { createdAssets, loadMoreURL, createdAssetLoading, loadMoreLoading } = useSelector(
        (state) => state.createdAssets,
    );
    const { callingAssetsAction } = useSelector((state) => state.marketplace);

    const assetsInWallet = useContext(AssetsFromWallet);
    useEffect(() => {
        const currentRequest = axios.CancelToken.source();
        if ((isLoggedIn || user.creation_visibility) && username) {
            if (showType === SHOW_TYPE.grid) {
                dispatch(
                    getCreatedAssets(username, filters, sortOption, searchKey, currentRequest),
                );
            } else {
                let tableSort = '';
                if (listViewSort.direction === 'asc') {
                    tableSort = `${listViewSort.field}`;
                } else if (listViewSort.direction === 'desc') {
                    tableSort = `-${listViewSort.field}`;
                }
                dispatch(
                    getCreatedAssetsForTable(
                        username,
                        filters,
                        tableSort,
                        searchKey,
                        currentRequest,
                    ),
                );
            }
        }
        return () => currentRequest?.cancel();
    }, [
        dispatch,
        username,
        isLoggedIn,
        user.creation_visibility,
        filters,
        sortOption,
        showType,
        searchKey,
        listViewSort,
    ]);

    const onOpenCreatorDialog = () => {
        setCreatorDialog(true);
    };
    const onCloseCreatorDialog = () => {
        setCreatorDialog(false);
    };
    const onOpenRequestSentDialog = () => {
        setCreatorDialog(false);
        setRequestSentDialog(true);
    };
    const onCloseRequestSentDialog = () => {
        setRequestSentDialog(false);
    };

    const loadMore = () => {
        dispatch(loadMoreCreatedItems(loadMoreURL));
    };

    const handleSelectAsset = (checked, assetIds) => {
        if (checked) {
            setSelectedAssets(Array.from(new Set([...selectedAssets, ...assetIds])));
        } else {
            setSelectedAssets(selectedAssets.filter((a) => !assetIds.includes(a)));
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedAssets(createdAssets.map((item) => item?.asset?.asset_id));
        } else {
            setSelectedAssets([]);
        }
    };
    const setToPrivate = () => {
        if (selectedAssets.length > 0) {
            dispatch(
                updateAssetVisibilities({
                    asset_ids: selectedAssets,
                    visibility: 'private',
                }),
            );
            setSelectedAssets([]);
        }
    };

    const setToPublic = () => {
        if (selectedAssets.length > 0) {
            dispatch(
                updateAssetVisibilities({
                    asset_ids: selectedAssets,
                    visibility: 'public',
                }),
            );
            setSelectedAssets([]);
        }
    };

    const deleteAssetFromReducer = (guid) => {
        dispatch(removeAsset(guid));
    };
    const canCreate =
        user?.role &&
        (!createdAssetLoading || createdAssets?.length !== 0) &&
        user?.role !== ANONYMOUS;

    const canBecomeACreator = canCreate && !isMobile && user?.role !== CREATOR;
    return (
        <>
            <div className="profile-filter">
                <SearchBox
                    searchKey={searchKey}
                    onSearch={(e) => {
                        setSelectedAssets([]);
                        setSearchKey(e);
                    }}
                />
                <Box display="flex" className="right-btns-group">
                    <ShowStyle
                        selected={showType}
                        onChange={(e) => {
                            setSelectedAssets([]);
                            setShowType(e);
                        }}
                    />
                    <FlexibleDropdownFilter
                        filters={PROFILE_FILTERS_CREATION}
                        setFilters={(e) => {
                            setSelectedAssets([]);
                            setFilters(e);
                        }}
                        selectedFilters={filters}
                    />
                    <FlexibleDropdownSort
                        setSort={(e) => {
                            setSelectedAssets([]);
                            setSortOption(e);
                        }}
                        sortOptions={PROFILE_SORTS}
                        sortingOption={sortOption}
                    />
                </Box>
            </div>
            {isMyProfile && showType === SHOW_TYPE.grid && (
                <SelectAll
                    handleSelectAll={handleSelectAll}
                    selectedCount={selectedAssets.length}
                    allCount={createdAssets.length}
                >
                    <MenuItem onClick={() => setToPrivate()}>Set To Private</MenuItem>
                    <MenuItem onClick={() => setToPublic()}>Set To Public</MenuItem>
                </SelectAll>
            )}
            <div>
                {showType === SHOW_TYPE.grid && (
                    <InfiniteScroll
                        dataLength={createdAssets.length}
                        next={loadMore}
                        hasMore={loadMoreURL ? true : false}
                        loader={
                            <LottieContainer
                                containerStyles={{
                                    height: '49px',
                                    width: '100%',
                                    marginTop: '40px',
                                }}
                                lottieStyles={{ width: '50px' }}
                            />
                        }
                        style={{ overflow: 'hidden' }}
                    >
                        <Grid
                            container
                            spacing={3}
                            justifyContent={createdAssets?.length === 0 ? 'center' : 'flex-start'}
                        >
                            {createdAssetLoading && createdAssets?.length === 0 && (
                                <LottieContainer
                                    containerStyles={{
                                        height: '49px',
                                        width: '100%',
                                        marginTop: '40px',
                                    }}
                                    lottieStyles={{ width: '50px' }}
                                />
                            )}
                            {canBecomeACreator && (
                                <Grid
                                    item
                                    lg={4}
                                    md={6}
                                    sm={6}
                                    xs={6}
                                    className="mb-2 white-card desktop-only"
                                >
                                    <Card className="h-100">
                                        <Box
                                            mb={1}
                                            px={4}
                                            py={4}
                                            display="flex"
                                            flexDirection="column"
                                            alignItems="center"
                                            textAlign="center"
                                            height="100%"
                                        >
                                            <Box
                                                my="auto"
                                                display="flex"
                                                flexDirection="column"
                                                alignItems="center"
                                            >
                                                <div className="logo-with-icon">
                                                    <Logo type="logoIcon" width="167" />
                                                    <span>
                                                        <AddOutlined style={{ fontSize: 42 }} />
                                                    </span>
                                                </div>
                                                <Box
                                                    className="white-card-text"
                                                    fontSize={20}
                                                    fontWeight="bold"
                                                    fontFamily="h1.fontFamily"
                                                    mt={3}
                                                >
                                                    Upload File
                                                </Box>
                                                <Box
                                                    className="white-card-text"
                                                    fontSize={16}
                                                    color="text.black70"
                                                    mt={1.5}
                                                >
                                                    Begin creating your gallery
                                                </Box>
                                            </Box>
                                            <Box width="100%" mt={{ xs: 2, sm: 4 }}>
                                                <Button
                                                    variant="contained"
                                                    color={
                                                        user?.is_become_creator
                                                            ? 'default'
                                                            : 'primary'
                                                    }
                                                    size="large"
                                                    fullWidth
                                                    disabled={user?.is_become_creator}
                                                    onClick={onOpenCreatorDialog}
                                                >
                                                    Become a Creator
                                                </Button>
                                            </Box>
                                        </Box>
                                    </Card>
                                </Grid>
                            )}
                            {!isLoggedIn && !user.creation_visibility && (
                                <span style={{ fontSize: '18px' }}>This account is private</span>
                            )}
                            {(!user.role || user.role === ANONYMOUS) &&
                                createdAssets?.length === 0 &&
                                !createdAssetLoading &&
                                'No Assets'}

                            <Grid item xs={12} className="mobile-only">
                                <Box pt={3}>
                                    <Typography variant="h4" className="text-white">
                                        Creations
                                    </Typography>
                                </Box>
                            </Grid>
                            {createdAssets
                                ?.filter((x) => x.asset)
                                ?.map((item) => (
                                    <Grid
                                        item
                                        lg={4}
                                        md={6}
                                        sm={6}
                                        xs={6}
                                        key={item?.guid}
                                        className="mb-2"
                                    >
                                        <AssetCard
                                            item={item}
                                            upvoteAsset={upvoteCreatedAsset}
                                            unUpvoteAsset={unUpvoteCreatedAsset}
                                            toFavoritesAssets={toFavoritesCreatedAssets}
                                            removeFromFavoritesAssets={
                                                removeFromFavoritesCreatedAssets
                                            }
                                            isLoggedIn={isLoggedIn}
                                            changeAssetVisibility={changeCreatedAssetVisibility}
                                            assetsInWallet={assetsInWallet}
                                            updateAsset={placeABidAction}
                                            buyNowSuccess={buyNowSuccess}
                                            afterMakeAnOffer={afterMakeAnOffer}
                                            selectable
                                            selected={selectedAssets.includes(
                                                item?.asset?.asset_id,
                                            )}
                                            selectAsset={handleSelectAsset}
                                            deleteAssetFromReducer={deleteAssetFromReducer}
                                            isMyProfile={isMyProfile}
                                        />
                                    </Grid>
                                ))}
                        </Grid>
                    </InfiniteScroll>
                )}
                {showType === SHOW_TYPE.list && (
                    <>
                        <Box display="flex" justifyContent="flex-end" width="100%" mb={2}>
                            <Button
                                variant="contained"
                                color="primary"
                                size="medium"
                                onClick={onOpenCreatorDialog}
                            >
                                Become a Creator
                            </Button>
                        </Box>
                        <Grid item xs={12} className="mb-2">
                            <AssetList
                                items={createdAssets}
                                changeAssetVisibility={changeCreatedAssetVisibility}
                                selectedAssets={selectedAssets}
                                hasMore={loadMoreURL ? true : false}
                                sort={listViewSort}
                                onSortChange={(sort) => {
                                    setSelectedAssets([]);
                                    setListViewSort(sort);
                                }}
                                selectAsset={handleSelectAsset}
                                loadMore={loadMore}
                                loadMoreLoading={loadMoreLoading}
                                setToPrivate={setToPrivate}
                                setToPublic={setToPublic}
                                loading={createdAssetLoading && createdAssets?.length === 0}
                                callingAssetAction={callingAssetsAction}
                                isMyProfile={isMyProfile}
                            />
                        </Grid>
                    </>
                )}
                <BecomeCreator
                    creatorDialog={creatorDialog}
                    onCloseCreatorDialog={onCloseCreatorDialog}
                    onOpenRequestSentDialog={onOpenRequestSentDialog}
                />
                <RequestSent
                    requestSentDialog={requestSentDialog}
                    onCloseRequestSentDialog={onCloseRequestSentDialog}
                />
            </div>
        </>
    );
};

export default ProfileCreated;
