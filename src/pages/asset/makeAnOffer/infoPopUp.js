import React from 'react';
import { Typography } from '@material-ui/core';
import Popover from '@material-ui/core/Popover';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
    popover: {
        pointerEvents: 'none',
    },
    paper: {
        padding: theme.spacing(1),
    },
}));

const InfoPopUp = ({ openPopover, anchorEl, handlePopoverClose, info }) => {
    const classes = useStyles();
    return (
        <Popover
            className={`${classes.popover} info-popover`}
            classes={{
                paper: classes.paper,
            }}
            open={openPopover}
            anchorEl={anchorEl}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
            }}
            onClose={handlePopoverClose}
            disableRestoreFocus
        >
            <Typography>{info}</Typography>
        </Popover>
    );
};

export default InfoPopUp;
